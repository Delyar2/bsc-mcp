import {
    parseAbi,
    type Address,
    Hex,
    PrivateKeyAccount,
} from 'viem';
import {
    Pool,
    Position,
    nearestUsableTick,
    FeeAmount,
    encodeSqrtRatioX96
} from '@pancakeswap/v3-sdk';
import { ChainId, Currency, CurrencyAmount, Percent, Token } from '@pancakeswap/sdk';

import dotenv from 'dotenv';
import { publicClient, walletClient } from '../config.js';
import { TICK_SPACINGS, TickMath } from "@pancakeswap/v3-sdk";
import { FACTORY_ADDRESSES, NFT_POSITION_MANAGER_ADDRESSES } from '@pancakeswap/v3-sdk';

const POSITION_MANAGER_ADDRESS = NFT_POSITION_MANAGER_ADDRESSES[ChainId.BSC];
const FACTORY_ADDRESS = FACTORY_ADDRESSES[ChainId.BSC];

dotenv.config();


// Contract ABI definitions
const FACTORY_ABI = parseAbi([
    'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
]);

const POOL_ABI = parseAbi([
    'function liquidity() external view returns (uint128)',
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
]);

const ERC20_ABI = parseAbi([
    'function allowance(address owner, address spender) external view returns (uint256)',
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function balanceOf(address account) external view returns (uint256)'
]);

const POSITION_MANAGER_ABI = [
    { "inputs": [{ "components": [{ "internalType": "address", "name": "token0", "type": "address" }, { "internalType": "address", "name": "token1", "type": "address" }, { "internalType": "uint24", "name": "fee", "type": "uint24" }, { "internalType": "int24", "name": "tickLower", "type": "int24" }, { "internalType": "int24", "name": "tickUpper", "type": "int24" }, { "internalType": "uint256", "name": "amount0Desired", "type": "uint256" }, { "internalType": "uint256", "name": "amount1Desired", "type": "uint256" }, { "internalType": "uint256", "name": "amount0Min", "type": "uint256" }, { "internalType": "uint256", "name": "amount1Min", "type": "uint256" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "internalType": "struct INonfungiblePositionManager.MintParams", "name": "params", "type": "tuple" }], "name": "mint", "outputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "internalType": "uint128", "name": "liquidity", "type": "uint128" }, { "internalType": "uint256", "name": "amount0", "type": "uint256" }, { "internalType": "uint256", "name": "amount1", "type": "uint256" }], "stateMutability": "payable", "type": "function" }
];

async function approveTokensIfNeeded(
    account: PrivateKeyAccount,
    token: Currency,
    spender: Address,
    amount: string,
): Promise<void> {

    if (!token.isNative) {
        const tokenAddress = token.address as Address;
        const accountAddress = account.address;

        const allowance = await publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [accountAddress, spender]
        });

        if (BigInt(allowance.toString()) < BigInt(amount)) {
            
            const hash = await walletClient(account).writeContract({
                account: account,
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [spender, BigInt(amount)],
            });

            await publicClient.waitForTransactionReceipt({ hash });
        }
    }
}

function sortTokens(
    tokenA: Currency,
    tokenB: Currency,
    amountA: CurrencyAmount<Currency>,
    amountB: CurrencyAmount<Currency>,
): [Token, Token, CurrencyAmount<Currency>, CurrencyAmount<Currency>] {
    let token0 = tokenA.isNative ? tokenA.wrapped : tokenA;
    let token1 = tokenB.isNative ? tokenB.wrapped : tokenB;
    if (token0.sortsBefore(token1)) {
        return [token0, token1, amountA, amountB];
    } else {
        return [token1, token0, amountB, amountA];
    }
}

async function checkBalance(
    account: PrivateKeyAccount,
    token: Currency,
    amount: CurrencyAmount<Currency>
) {
    const accountAddress = account.address;
    if (token.isNative) {
        const balance = await publicClient.getBalance({ address: accountAddress });
        const balanceAmount = CurrencyAmount.fromRawAmount(token, balance.toString());
        if (balanceAmount.lessThan(amount)) {
            throw new Error(`Insufficient balance of ${token.symbol}`);
        }
        return
    }
    const balance = await publicClient.readContract({
        address: token.address as Address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [accountAddress]
    });
    const balanceAmount = CurrencyAmount.fromRawAmount(token, balance.toString());
    if (balanceAmount.lessThan(amount)) {
        throw new Error(`Insufficient balance of ${token.symbol}`);
    }
}

/**
 * Add V3 liquidity
 * @param tokenA first token
 * @param tokenB second token
 * @param fee fee tier
 * @param amountA amount of tokenA
 * @param amountB amount of tokenB
 * @param account account
 * @param slippageTolerance slippage tolerance
 * @param deadline transaction deadline
 * @param priceLower lower price bound percentage (default: 80% of current price)
 * @param priceUpper upper price bound percentage (default: 120% of current price)
 * @returns transaction receipt
 */

export async function addLiquidityV3(
    tokenA: Currency,
    tokenB: Currency,
    fee: FeeAmount,
    amountA: CurrencyAmount<Currency>,
    amountB: CurrencyAmount<Currency>,
    account: PrivateKeyAccount,
    slippageTolerance: Percent = new Percent('50', '10000'), // default 0.5%
    deadline: number = Math.floor(Date.now() / 1000) + 20 * 60, // default 20 minutes
    priceLower: number = 0.8,
    priceUpper: number = 1.2
): Promise<Hex> {
    

    await Promise.all([
        approveTokensIfNeeded(account, tokenA, POSITION_MANAGER_ADDRESS, amountA.quotient.toString()),
        approveTokensIfNeeded(account, tokenB, POSITION_MANAGER_ADDRESS, amountB.quotient.toString()),
    ]);

    await checkBalance(account, tokenA, amountA)
    await checkBalance(account, tokenB, amountB)

    const [token0, token1, amount0, amount1] = sortTokens(tokenA, tokenB, amountA, amountB);

    const poolAddress = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'getPool',
        args: [
            token0.address as Address,
            token1.address as Address,
            fee
        ]
    }) as Address;

    if (!poolAddress || poolAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error(`Pool for ${tokenA.symbol}/${tokenB.symbol} not found`);
    }

    const [liquidity, slot0] = await Promise.all([
        publicClient.readContract({
            address: poolAddress,
            abi: POOL_ABI,
            functionName: 'liquidity'
        }),
        publicClient.readContract({
            address: poolAddress,
            abi: POOL_ABI,
            functionName: 'slot0'
        })
    ]);

    const pool = new Pool(
        token0,
        token1,
        fee,
        (slot0 as any)[0].toString(), // sqrtPriceX96
        liquidity.toString(),
        (slot0 as any)[1] // tick
    );
    // Retrieve tickSpacing from the SDK constants
    const tickSpacing = TICK_SPACINGS[fee]; // fee should correspond to a valid
    // Convert prices to square root ratio and then to ticks
    const priceLowerRatio = encodeSqrtRatioX96(priceLower * 1e18, 1e18);
    const priceUpperRatio = encodeSqrtRatioX96(priceUpper * 1e18, 1e18);
    const lowerPriceTick = TickMath.getTickAtSqrtRatio(priceLowerRatio);
    const upperPriceTick = TickMath.getTickAtSqrtRatio(priceUpperRatio);
    // Round ticks to the nearest valid tick
    const tickLower = nearestUsableTick(lowerPriceTick, tickSpacing);
    const tickUpper = nearestUsableTick(upperPriceTick, tickSpacing);


    const position = Position.fromAmounts({
        pool,
        tickLower,
        tickUpper,
        amount0: amount0.quotient.toString(),
        amount1: amount1.quotient.toString(),
        useFullPrecision: true
    });

    const { amount0: amount0Min, amount1: amount1Min } = position.mintAmountsWithSlippage(slippageTolerance);

    const value = tokenA.isNative
        ? amountA.quotient.toString()
        : tokenB.isNative
            ? amountB.quotient.toString()
            : '0';

    const mintParams = {
        token0: token0.address as Address,
        token1: token1.address as Address,
        fee,
        tickLower,
        tickUpper,
        amount0Desired: BigInt(amount0.quotient.toString()),
        amount1Desired: BigInt(amount1.quotient.toString()),
        amount0Min: BigInt(amount0Min.toString()),
        amount1Min: BigInt(amount1Min.toString()),
        recipient: account.address,
        deadline: BigInt(deadline)
    };

    const hash = await walletClient(account).writeContract({
        address: POSITION_MANAGER_ADDRESS,
        abi: POSITION_MANAGER_ABI,
        functionName: 'mint',
        args: [mintParams],
        value: BigInt(value),
        account: account
    });
    return hash;
}