import { Hex, http, publicActions, createWalletClient, createPublicClient, PrivateKeyAccount } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";
import { getPassword, } from "./util.js";
import { decryptPrivateKey, } from "./PrivateAES.js";

export const rpcUrl = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";

class ObfuscatedSecureBuffer {
    private buffers: Uint8Array[] = [];
    private indexMap: number[] = [];
    private salt: Uint8Array = new Uint8Array(32);
    private length: number = 0;
    private isActive = false;

    constructor() {
    }
    updata(data: Uint8Array | string) {
        let originalData: Uint8Array;
        if (typeof data === 'string') {
            const hexString = data.startsWith('0x') ? data.slice(2) : data;
            originalData = new Uint8Array(hexString.length / 2);
            for (let i = 0; i < hexString.length; i += 2) {
                originalData[i / 2] = parseInt(hexString.substr(i, 2), 16);
            }
        } else {
            originalData = new Uint8Array(data);
        }

        this.length = originalData.length;

        this.salt = new Uint8Array(32);
        crypto.getRandomValues(this.salt);

        const bufferCount = 3;
        this.buffers = [];

        for (let i = 0; i < bufferCount; i++) {
            const buffer = new Uint8Array(this.length);
            crypto.getRandomValues(buffer);
            this.buffers.push(buffer);
        }

        this.indexMap = Array.from({ length: this.length }, (_, i) => i)
            .sort(() => 0.5 - Math.random());

        for (let i = 0; i < this.length; i++) {
            const targetIndex = this.indexMap[i];
            const bufferIndex = i % bufferCount;

            const saltByte = this.salt[i % this.salt.length];
            const obfuscatedByte = originalData[i] ^ saltByte ^ (i & 0xff);

            this.buffers[bufferIndex][targetIndex] = obfuscatedByte;
        }
        this.isActive = true;
    }

    getData(): Uint8Array {
        const result = new Uint8Array(this.length);
        const bufferCount = this.buffers.length;

        for (let i = 0; i < this.length; i++) {
            const targetIndex = this.indexMap[i];
            const bufferIndex = i % bufferCount;

            const saltByte = this.salt[i % this.salt.length];
            const obfuscatedByte = this.buffers[bufferIndex][targetIndex];
            result[i] = obfuscatedByte ^ saltByte ^ (i & 0xff);
        }

        return result;
    }

    getHexString(): string {
        const data = this.getData();
        return '0x' + Array.from(data)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    zeroize(): void {
        for (const buffer of this.buffers) {
            buffer.fill(0);
            crypto.getRandomValues(buffer);
            buffer.fill(0xff);
            buffer.fill(0);
        }

        this.salt.fill(0);
        this.indexMap.fill(0);

        this.buffers = [];
        this.indexMap = [];

        this.isActive = false;
    }

    active(): boolean {
        return this.isActive;
    }
}


let obfuscatedPrivateKey = new ObfuscatedSecureBuffer();;
export const getAccount = async () => {
    const BSC_WALLET_PRIVATE_KEY = process.env.BSC_WALLET_PRIVATE_KEY as Hex
    if (!BSC_WALLET_PRIVATE_KEY) {
        throw new Error("BSC_WALLET_PRIVATE_KEY is not defined");
    }
    if (obfuscatedPrivateKey.active()) {
        const pk = obfuscatedPrivateKey.getHexString();
        return privateKeyToAccount(
            pk as Hex
        );
    }

    const { agreed, value: password } = await getPassword()
    if (!password) {
        throw new Error("You did not enter a password.");
    }

    const pk = await decryptPrivateKey(BSC_WALLET_PRIVATE_KEY, password);

    if (agreed) {

        obfuscatedPrivateKey.updata(pk as string);
        setTimeout(() => {
            obfuscatedPrivateKey.zeroize();
        }, 1000 * 60 * 60);
        return privateKeyToAccount(
            pk as Hex
        );
    } else {

        return privateKeyToAccount(
            pk as Hex
        );
    }

};

export const getClient = async () => {
    const account = await getAccount()
    const client = createWalletClient({
        account,
        chain: bsc,
        transport: http(rpcUrl),
    }).extend(publicActions);

    return client;
};

export const publicClient = createPublicClient({
    chain: bsc,
    transport: http(rpcUrl),
});

export const walletClient = (account: PrivateKeyAccount) => createWalletClient({
    chain: bsc,
    transport: http(rpcUrl),
    account: account,
});