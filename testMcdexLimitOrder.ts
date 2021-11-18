import BigNumber from 'bignumber.js'
import { ethers, Wallet } from 'ethers'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

// 4.137
// .dp(1,halfeven)
export enum OrderTypeParams {
  LimitOrder = 1,
  StopOrder = 2,
}

export enum TradeFlag {
  MASK_CLOSE_ONLY = 0x80000000,
  MASK_MARKET_ORDER = 0x40000000,
  MASK_STOP_LOSS_ORDER = 0x20000000,
  MASK_TAKE_PROFIT_ORDER = 0x10000000,
  MASK_USE_TARGET_LEVERAGE = 0x08000000
}

export enum SignType {
  EthSign = 'ethSign',
  EIP712 = 'eip712',
}

export interface OrderApiRequestParams {
  address: string
  orderHash: string
  orderType: number
  liquidityPoolAddress: string
  brokerAddress: string
  relayerAddress: string
  referrerAddress?: string
  perpetualIndex: number
  price: string
  amount: string
  minTradeAmount: string
  brokerFeeLimit: number // in gwei
  triggerPrice?: string
  // current unix timestamp + expire second
  expiresAt: number
  isCloseOnly: boolean
  chainID: number
  salt: number
  r: string
  s: string
  v: string
  signType: SignType
  targetLeverage: string
}

export interface PerpetualV3OrderToSign {
  trader: string
  broker: string
  relayer: string
  referrer: string
  liquidityPool: string
  minTradeAmount: string
  amount: string
  limitPrice: string
  triggerPrice: string
  chainID: string
  expiredAt: string
  perpetualIndex: string
  brokerFeeLimit: string
  flags: string
  salt: string
}

const _wad = new BigNumber('1000000000000000000')
//
export function toWad(x: BigNumber | string): string {
  return new BigNumber(x).times(_wad).dp(0, BigNumber.ROUND_DOWN).toFixed()
}

export function fromWad(x: BigNumber | string): string {
  return new BigNumber(x).div(_wad).toFixed()
}

function string2Hex(message: string): string {
  return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message))
}

function keccak256String(message: string): string {
  //let messageBytes = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message))
  let messageHex = string2Hex(message)
  return ethers.utils.keccak256(messageHex)
}

function keccak256Hex(message: string): string {
  return ethers.utils.keccak256(message)
}

function getDomainSeparator(): string {
  return keccak256Hex(EIP712_DOMAIN_TYPE_HASH + keccak256String('Mai Protocol v3').slice(2))
}

function getEIP712MessageHash(message: string): string {
  let hash = keccak256Hex('0x1901' + getDomainSeparator().slice(2) + message.slice(2))
  return hash
}


interface Signature {
  r: string
  s: string
  v: string
}

// make the result of eth_sign compatible with EIP155 where the v is either 27 or 28
function normalizeSign(sign: string): Signature {
  if (sign.length != 132) {
    throw new Error('sign should consist up with 0x{r}{s}{v}')
  }
  const r = sign.slice(2, 2 + 64)
  const s = sign.slice(2 + 64, 2 + 128)
  let v = sign.slice(2 + 128)

  const tail = parseInt(v, 16)
  if (tail < 27) {
    v = (tail + 27).toString(16).toLowerCase()
  }
  return { r, s, v }
}

export class UnsupportEIP712Error extends Error {
}

async function signTypedDataV3(eip712Msg: any): Promise<string> {
  const from = this.address
  const params = [from, JSON.stringify(eip712Msg)]
  try {
    return await this._web3Provider.send('eth_signTypedData_v3', params)
  } catch (e) {
    // when connect to hardware wallet, it is not supported EIP
    if (e.code === -32603) {
      throw new UnsupportEIP712Error()
    }
    throw e
  }
}

async function signOrder(
  wallet: Wallet,
  orderHash: string,
  v3json: PerpetualV3OrderToSign | null,
): Promise<{ signature: Signature, signType: SignType }> {
  // // EIP712

  // if (wallet.signTypedDataV3) {
  //   try {
  //     if (v3json != null) {
  //       const eip712 = getMaiV3EIP712Message(v3json)
  //       const result = wallet.signTypedDataV3(eip712)
  //       return {
  //         signature: normalizeSign(result),
  //         signType: SignType.EIP712,
  //       }
  //     }
  //   } catch (e) {
  //     if (e instanceof UnsupportEIP712Error) {
  //       console.log('the wallet does not support eip712, fall back to normal personal sign.')
  //     } else {
  //       throw e
  //     }
  //   }
  // }
  // // not EIP712
  const result = await wallet.signMessage(ethers.utils.arrayify(orderHash))
  return {
    signature: normalizeSign(result),
    signType: SignType.EthSign,
  }
}

const EIP712_DOMAIN_TYPE_HASH = keccak256String('EIP712Domain(string name)')
const EIP712_ORDER_TYPE = keccak256String(
  'Order(address trader,address broker,address relayer,address referrer,address liquidityPool,int256 minTradeAmount,int256 amount,int256 limitPrice,int256 triggerPrice,uint256 chainID,uint64 expiredAt,uint32 perpetualIndex,uint32 brokerFeeLimit,uint32 flags,uint32 salt)',
)

export function getLeverageFlag(leverage: number) {
  return new BigNumber(new BigNumber(leverage).toFormat(2)).times(100).toNumber() << 7
}

export function getOrderFlag(orderType: number, isCloseOnly: boolean, leverage: number): number {
  /*
	*          Flags is a 32 bit uint value which indicates: (from highest bit)
	*            31               27 26                     7 6              0
	*           +---+---+---+---+---+------------------------+----------------+
	*           | C | M | S | T | R | Target leverage 20bits | Reserved 7bits |
	*           +---+---+---+---+---+------------------------+----------------+
	*             |   |   |   |   |   ` Target leverage  Fixed-point decimal with 2 decimal digits. Example: 599 means 5.99
	*             |   |   |   |   |                      0 means don't automatically deposit / withdraw.
	*             |   |   |   |   `---  Reserved
	*             |   |   |   `-------  Take profit      Only available in brokerTrade mode.
	*             |   |   `-----------  Stop loss        Only available in brokerTrade mode.
	*             |   `---------------  Market order     Do not check limit price during trading.
	*             `-------------------  Close only       Only close position during trading.
	*/
  let orderFlag: number = 0
  if (isCloseOnly) {
    orderFlag += TradeFlag.MASK_CLOSE_ONLY
  }
  if (orderType == OrderTypeParams.StopOrder) {
    orderFlag += TradeFlag.MASK_STOP_LOSS_ORDER
  }
  return orderFlag + getLeverageFlag(leverage)
}

export function getOrderHash(orderParam: OrderApiRequestParams): string {
  let orderFlag = getOrderFlag(orderParam.orderType, orderParam.isCloseOnly, Number(orderParam.targetLeverage))

  let coder: ethers.utils.AbiCoder = ethers.utils.defaultAbiCoder
  const result = coder.encode(
    ['bytes32', 'address', 'address', 'address', 'address', 'address',
      'int256', 'int256', 'int256', 'int256', 'uint256',
      'uint64', 'uint32', 'uint32', 'uint32', 'uint32'],
    [EIP712_ORDER_TYPE,
      orderParam.address,
      orderParam.brokerAddress,
      orderParam.relayerAddress,
      orderParam.referrerAddress,
      orderParam.liquidityPoolAddress,

      orderParam.minTradeAmount,
      orderParam.amount,
      orderParam.price,
      orderParam.triggerPrice,
      orderParam.chainID,

      Number(orderParam.expiresAt),
      orderParam.perpetualIndex,
      orderParam.brokerFeeLimit, // in gwei
      Number(orderFlag),
      Number(orderParam.salt),
    ],
  )

  return getEIP712MessageHash(keccak256Hex(result))
}

//构建挂单请求的函数
async function buildOrderRequestParamsDatas() {
  let orderParam: OrderApiRequestParams = {
    address: '0xF9758dB6571Cfe61e6eB9146D82A0f0FF7ACBc45'.toLowerCase(),
    price: toWad('56000'),
    triggerPrice: '0', //for stop order
    amount: toWad('0.00001'),
    chainID: Number(421611),
    orderType: OrderTypeParams.LimitOrder,
    isCloseOnly: false,
    liquidityPoolAddress: '0xc32a2dfee97e2babc90a2b5e6aef41e789ef2e13'.toLowerCase(),
    perpetualIndex: 0,
    brokerAddress: '0xbCCF6C081d9aa6E8B85602C04e66c5405D9be4A7'.toLowerCase(),
    relayerAddress: '0xd595f7c2c071d3fd8f5587931edf34e92f9ad39f'.toLowerCase(),
    referrerAddress: '0x0000000000000000000000000000000000000000',
    minTradeAmount: toWad('0.1'),
    brokerFeeLimit: 100000000,
    expiresAt: 1638275785,
    salt: Math.round(Math.random() * 10000000),
    orderHash: '', // assigned later
    r: '', // assigned later
    s: '', // assigned later
    v: '', // assigned later
    signType: SignType.EthSign, // assigned later
    targetLeverage: '2.23'
  }
  const orderHash = getOrderHash(orderParam)
  let orderFlag = getOrderFlag(orderParam.orderType, orderParam.isCloseOnly, Number(orderParam.targetLeverage))
  const v3json: PerpetualV3OrderToSign = {
    trader: orderParam.address,
    broker: orderParam.brokerAddress,
    relayer: orderParam.relayerAddress,
    referrer: orderParam.referrerAddress,
    liquidityPool: orderParam.liquidityPoolAddress,
    minTradeAmount: orderParam.minTradeAmount,
    amount: orderParam.amount,
    limitPrice: orderParam.price,
    triggerPrice: orderParam.triggerPrice || '0',
    chainID: orderParam.chainID.toString(),
    expiredAt: orderParam.expiresAt.toString(),
    perpetualIndex: orderParam.perpetualIndex.toString(),
    brokerFeeLimit: orderParam.brokerFeeLimit.toString(),
    flags: orderFlag.toString(),
    salt: orderParam.salt.toString(),
  }

  console.log(orderParam)

  let privateKey = '7f4fc6b1be03219f7f34bb0e4f12c2ff9983c08330defc8058fd949993c16281' // set your trader address private key for sign params
  let wallet = new ethers.Wallet(privateKey)
  let signOrderResult = await signOrder(wallet, orderHash, v3json)
  orderParam.orderHash = orderHash
  orderParam.r = signOrderResult.signature.r
  orderParam.s = signOrderResult.signature.s
  orderParam.v = signOrderResult.signature.v
  orderParam.signType = signOrderResult.signType

  // update date orderParam price and amount for backend
  orderParam.amount = fromWad(orderParam.amount)
  orderParam.price = fromWad(orderParam.price)
  orderParam.minTradeAmount = fromWad(orderParam.minTradeAmount)
  orderParam.triggerPrice = fromWad(orderParam.triggerPrice || '0')
  return orderParam
}

export class APIClient {
  protected axios: AxiosInstance

  constructor(serverUrl: string, timeout = 10) {
    this.axios = axios.create({
      baseURL: serverUrl,
      timeout: timeout,
    })
  }

  request(config: AxiosRequestConfig) {
    return this.axios.request(config)
  }

  setHeader(options: { [key: string]: string | number }) {
    this.axios.defaults.headers = { ...this.axios.defaults.headers, ...options }
  }

  setResponseInterceptors(onFulfilled?: (value: any) => any | Promise<any>, onRejected?: (error: any) => any) {
    this.axios.interceptors.response.use(onFulfilled, onRejected)
  }
}

export async function placeOrder(requestParams: OrderApiRequestParams) {
  const defaultRelayerServerAPIClient = new APIClient("https://bsc.mcdex.io/api/")
  const result = (await defaultRelayerServerAPIClient.request({
    url: 'orders',
    method: 'post',
    data: requestParams,
  })) as any
  return result
}


async function PlaceApiOrder() {
    //构建挂单需要的参数
  let apiParams = await buildOrderRequestParamsDatas()
  //调用挂单函数，并获取结果
  const response = placeOrder(apiParams)
  console.log(response)
}

// 进行挂单交易的函数
PlaceApiOrder()
