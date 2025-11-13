import { ChainId, Native, Percent } from "@pancakeswap/sdk";
import { PositionMath, Multicall } from "@pancakeswap/v3-sdk";
import { 
    Address, 
    Hex, 
    encodeFunctionData, 
    getAddress, 
    zeroAddress, 
    maxUint128, 
    parseAbi,
    PrivateKeyAccount,
    publicActions, 
} from "viem";

import dotenv from 'dotenv';
import { publicClient, walletClient } from "../config.js";

dotenv.config();


const positionManagerABI = [

    {
        inputs: [
            {
                components: [
                    { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
                    { internalType: 'uint128', name: 'liquidity', type: 'uint128' },
                    { internalType: 'uint256', name: 'amount0Min', type: 'uint256' },
                    { internalType: 'uint256', name: 'amount1Min', type: 'uint256' },
                    { internalType: 'uint256', name: 'deadline', type: 'uint256' },
                ],
                internalType: 'struct INonfungiblePositionManager.DecreaseLiquidityParams',
                name: 'params',
                type: 'tuple',
            },
        ],
        name: 'decreaseLiquidity',
        outputs: [
            { internalType: 'uint256', name: 'amount0', type: 'uint256' },
            { internalType: 'uint256', name: 'amount1', type: 'uint256' },
        ],
        stateMutability: 'payable',
        type: 'function',
    },

    {
        inputs: [
            {
                components: [
                    { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
                    { internalType: 'address', name: 'recipient', type: 'address' },
                    { internalType: 'uint128', name: 'amount0Max', type: 'uint128' },
                    { internalType: 'uint128', name: 'amount1Max', type: 'uint128' },
                ],
                internalType: 'struct INonfungiblePositionManager.CollectParams',
                name: 'params',
                type: 'tuple',
            },
        ],
        name: 'collect',
        outputs: [
            { internalType: 'uint256', name: 'amount0', type: 'uint256' },
            { internalType: 'uint256', name: 'amount1', type: 'uint256' },
        ],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
        name: 'positions',
        outputs: [
            { internalType: 'uint96', name: 'nonce', type: 'uint96' },
            { internalType: 'address', name: 'operator', type: 'address' },
            { internalType: 'address', name: 'token0', type: 'address' },
            { internalType: 'address', name: 'token1', type: 'address' },
            { internalType: 'uint24', name: 'fee', type: 'uint24' },
            { internalType: 'int24', name: 'tickLower', type: 'int24' },
            { internalType: 'int24', name: 'tickUpper', type: 'int24' },
            { internalType: 'uint128', name: 'liquidity', type: 'uint128' },
            { internalType: 'uint256', name: 'feeGrowthInside0LastX128', type: 'uint256' },
            { internalType: 'uint256', name: 'feeGrowthInside1LastX128', type: 'uint256' },
            { internalType: 'uint128', name: 'tokensOwed0', type: 'uint128' },
            { internalType: 'uint128', name: 'tokensOwed1', type: 'uint128' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
]

const FACTORY_ABI = parseAbi([
    'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
]);

const POOL_ABI = parseAbi([
    'function liquidity() external view returns (uint128)',
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
]);

const Payments_ABI = [


    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'amountMinimum',
                type: 'uint256',
            },
            {
                internalType: 'address',
                name: 'recipient',
                type: 'address',
            },
        ],
        name: 'unwrapWETH9',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'token',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'amountMinimum',
                type: 'uint256',
            },
            {
                internalType: 'address',
                name: 'recipient',
                type: 'address',
            },
        ],
        name: 'sweepToken',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
];
const POSITION_MANAGER_ADDRESS = '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364' as Address;
const FACTORY_ADDRESS = '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865' as Address;

export const removeLiquidityV3 = async (account: PrivateKeyAccount, tokenId: BigInt, percent: number) => {

    const calldatas: Hex[] = []

    const client = walletClient(account).extend(publicActions)

    const positionInfo = await publicClient.readContract({
        address: POSITION_MANAGER_ADDRESS,
        abi: positionManagerABI,
        functionName: 'positions',
        args: [tokenId]
    }) as any[]

    const bnb = Native.onChain(ChainId.BSC)

    const liquidity: bigint = new Percent(percent!, 100).multiply(positionInfo[7]).quotient

    // remove liquidity
    calldatas.push(encodeFunctionData({
        abi: positionManagerABI,
        functionName: 'decreaseLiquidity',
        args: [
            {
                tokenId,
                liquidity,
                amount0Min: BigInt(1),
                amount1Min: BigInt(1),
                deadline: Math.floor(Date.now() / 1000) + 1200,
            },
        ],
    }))


    const involvesETH = getAddress(bnb.wrapped.address) === getAddress(positionInfo[2])
        || getAddress(bnb.wrapped.address) === getAddress(positionInfo[3])



    calldatas.push(encodeFunctionData({
        abi: positionManagerABI,
        functionName: 'collect',
        args: [
            {
                tokenId,
                recipient: involvesETH ? zeroAddress : account.address,
                amount0Max: maxUint128,
                amount1Max: maxUint128,
            },
        ],
    }))

    if (involvesETH) {


        const poolAddrs = await client.readContract({
            address: FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            functionName: 'getPool',
            args: [
                positionInfo[2] as Address,
                positionInfo[3] as Address,
                positionInfo[4]
            ]
        })

        const slot0 = await client.readContract({
            address: poolAddrs as Address,
            abi: POOL_ABI,
            functionName: 'slot0',
        })

        const token0Amount = PositionMath.getToken0Amount(
            slot0[1],
            positionInfo[5],
            positionInfo[6],
            slot0[0],
            positionInfo[7],
        )
        const discountedAmount0 = new Percent(percent!, 100).multiply(token0Amount).quotient

        const token1Amount = PositionMath.getToken1Amount(
            slot0[1],
            positionInfo[5],
            positionInfo[6],
            slot0[0],
            positionInfo[7],
        )

        const discountedAmount1 = new Percent(percent!, 100).multiply(token1Amount).quotient

        const ethAmount = getAddress(bnb.wrapped.address) === getAddress(positionInfo[2])
            ? discountedAmount0
            : discountedAmount1
        const token = getAddress(bnb.wrapped.address) === getAddress(positionInfo[2])
            ? positionInfo[3]
            : positionInfo[2]
        const tokenAmount = getAddress(bnb.wrapped.address) === getAddress(positionInfo[2])
            ? discountedAmount1
            : discountedAmount0

        calldatas.push(encodeFunctionData({
            abi: Payments_ABI,
            functionName: 'unwrapWETH9',
            args: [ethAmount, account.address],
        }))
        calldatas.push(encodeFunctionData({
            abi: Payments_ABI,
            functionName: 'sweepToken',
            args: [token, tokenAmount, account.address],
        }))
    }

    const data = Multicall.encodeMulticall(calldatas)
    
    const tx = await client.sendTransaction({
        to: POSITION_MANAGER_ADDRESS,
        data: data,
        value: BigInt(0),
        account: account,
        chain: client.chain as any,
    })
    return tx
}