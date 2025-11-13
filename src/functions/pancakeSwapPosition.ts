
import dotenv from 'dotenv';
dotenv.config();

import { TickMath, SqrtPriceMath } from '@pancakeswap/v3-sdk';
import {
    Address,
    PrivateKeyAccount,
    formatUnits,
    parseAbi,
} from "viem";
import { publicClient, } from '../config.js';



const POSITION_MANAGER_ADDRESS = '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364' as Address;
const FACTORY_ADDRESS = '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865' as Address;

const FACTORY_ABI = parseAbi([
    'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
]);

const POOL_ABI = parseAbi([
    'function liquidity() external view returns (uint128)',
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
]);

const ERC20_ABI = parseAbi([
    'function decimals() external view returns (uint256)',
    'function symbol() external view returns (string)',
    'function name() external view returns (string)',
]);

const masterChefV3ABI = parseAbi([
    'function balanceOf(address account) external view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
    'function positions(uint256) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
]);

export const myPosition = async (accountAddress: Address) => {


    const balance = await publicClient.readContract({
        abi: masterChefV3ABI,
        address: POSITION_MANAGER_ADDRESS,
        functionName: 'balanceOf',
        args: [accountAddress],
    })


    if (Number(balance) === 0) {
        return;
    }

    const nftCalls = []
    for (let i = 0; i < Number(balance); i++) {
        const nftCall = {
            abi: masterChefV3ABI,
            address: POSITION_MANAGER_ADDRESS,
            functionName: 'tokenOfOwnerByIndex',
            args: [accountAddress, BigInt(i)],
        }
        nftCalls.push(nftCall)
    }


    const nftIds = await publicClient.multicall<BigInt[]>({
        contracts: nftCalls,
        allowFailure: false,
    })


    const positionCalls = nftIds.map((nftId) => {
        return {
            abi: masterChefV3ABI,
            address: POSITION_MANAGER_ADDRESS,
            functionName: 'positions',
            args: [nftId],
        }
    })

    const positions = await publicClient.multicall<any[]>({
        contracts: positionCalls,
        allowFailure: false,
    }) as any[]

    const getTokenInfo = async (token: Address) => {
        const infoCalls = [
            {
                address: token,
                abi: ERC20_ABI,
                functionName: 'symbol',
                args: [],
            },
            {
                address: token,
                abi: ERC20_ABI,
                functionName: 'name',
                args: [],
            },
            {
                address: token,
                abi: ERC20_ABI,
                functionName: 'decimals',
                args: [],
            },
        ]

        const tokenInfo = await publicClient.multicall<any[]>({
            contracts: infoCalls,
            allowFailure: false,
        }) as any[]
        return {
            token,
            symbol: tokenInfo[0] as string,
            name: tokenInfo[1] as string,
            decimals: Number(tokenInfo[2]),
        }
    }

    const poolTokenInfos = await Promise.all(positions.map(async (position) => {
        const tokenInfos = await Promise.all([
            getTokenInfo(position[2] as Address),
            getTokenInfo(position[3] as Address),
        ]);
        return {
            token0: tokenInfos[0],
            token1: tokenInfos[1],
        }
    })) as any[]

    const poolCalls = []
    for (const position of positions) {
        const poolCall = {
            address: FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            functionName: 'getPool',
            args: [
                position[2] as Address,
                position[3] as Address,
                BigInt(position[4])
            ]
        }
        poolCalls.push(poolCall);
    }

    const pools = await publicClient.multicall<any[]>({
        contracts: poolCalls,
        allowFailure: false,
    }) as any[]

    const slot0Calls = []
    for (const pool of pools) {
        const slot0Call = {
            address: pool as Address,
            abi: POOL_ABI,
            functionName: 'slot0',
        }
        slot0Calls.push(slot0Call);
    }
    const slot0s = await publicClient.multicall<any[]>({
        contracts: slot0Calls,
        allowFailure: false,
    }) as any[]

    const positionInfos = []
    for (let i = 0; i < pools.length; i++) {
        const positionInfo = {
            tickCurrent: slot0s[i][1],
            tickLower: positions[i][5],
            tickUpper: positions[i][6],
            liquidity: positions[i][7],
            ...poolTokenInfos[i],
            feeTier: positions[i][4],
            positionId: nftIds[i],
        }
        const sqrtPriceX96 = TickMath.getSqrtRatioAtTick(positionInfo.tickCurrent);
        const sqrtPriceAX96 = TickMath.getSqrtRatioAtTick(positionInfo.tickLower);
        const sqrtPriceBX96 = TickMath.getSqrtRatioAtTick(positionInfo.tickUpper);
        const liquidity = BigInt(positionInfo.liquidity);
        let amount0;
        let amount1;
        if (positionInfo.tickCurrent < positionInfo.tickLower) {
            amount0 = SqrtPriceMath.getAmount0Delta(sqrtPriceAX96, sqrtPriceBX96, liquidity,
                false);
            amount1 = BigInt(0);
        } else if (positionInfo.tickCurrent > positionInfo.tickUpper) {
            amount0 = BigInt(0);
            amount1 = SqrtPriceMath.getAmount1Delta(sqrtPriceAX96, sqrtPriceBX96, liquidity,
                false);
        } else {
            amount0 = SqrtPriceMath.getAmount0Delta(sqrtPriceX96, sqrtPriceBX96, liquidity,
                false);
            amount1 = SqrtPriceMath.getAmount1Delta(sqrtPriceAX96, sqrtPriceX96, liquidity,
                false);
        }
        positionInfos.push({
            ...positionInfo,
            amount0,
            amount1,
            amount0Format: formatUnits(amount0, Number(positionInfo.token0.decimals)),
            amount1Format: formatUnits(amount1, Number(positionInfo.token1.decimals)),
        });

    }

    return positionInfos;
}


