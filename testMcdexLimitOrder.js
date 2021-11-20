"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.placeOrder = exports.APIClient = exports.getOrderHash = exports.getOrderFlag = exports.getLeverageFlag = exports.UnsupportEIP712Error = exports.fromWad = exports.toWad = exports.SignType = exports.TradeFlag = exports.OrderTypeParams = void 0;
var bignumber_js_1 = require("bignumber.js");
var ethers_1 = require("ethers");
var axios_1 = require("axios");
// 4.137
// .dp(1,halfeven)
var OrderTypeParams;
(function (OrderTypeParams) {
    OrderTypeParams[OrderTypeParams["LimitOrder"] = 1] = "LimitOrder";
    OrderTypeParams[OrderTypeParams["StopOrder"] = 2] = "StopOrder";
})(OrderTypeParams = exports.OrderTypeParams || (exports.OrderTypeParams = {}));
var TradeFlag;
(function (TradeFlag) {
    TradeFlag[TradeFlag["MASK_CLOSE_ONLY"] = 2147483648] = "MASK_CLOSE_ONLY";
    TradeFlag[TradeFlag["MASK_MARKET_ORDER"] = 1073741824] = "MASK_MARKET_ORDER";
    TradeFlag[TradeFlag["MASK_STOP_LOSS_ORDER"] = 536870912] = "MASK_STOP_LOSS_ORDER";
    TradeFlag[TradeFlag["MASK_TAKE_PROFIT_ORDER"] = 268435456] = "MASK_TAKE_PROFIT_ORDER";
    TradeFlag[TradeFlag["MASK_USE_TARGET_LEVERAGE"] = 134217728] = "MASK_USE_TARGET_LEVERAGE";
})(TradeFlag = exports.TradeFlag || (exports.TradeFlag = {}));
var SignType;
(function (SignType) {
    SignType["EthSign"] = "ethSign";
    SignType["EIP712"] = "eip712";
})(SignType = exports.SignType || (exports.SignType = {}));
var _wad = new bignumber_js_1["default"]('1000000000000000000');
//
function toWad(x) {
    return new bignumber_js_1["default"](x).times(_wad).dp(0, bignumber_js_1["default"].ROUND_DOWN).toFixed();
}
exports.toWad = toWad;
function fromWad(x) {
    return new bignumber_js_1["default"](x).div(_wad).toFixed();
}
exports.fromWad = fromWad;
function string2Hex(message) {
    return ethers_1.ethers.utils.hexlify(ethers_1.ethers.utils.toUtf8Bytes(message));
}
function keccak256String(message) {
    //let messageBytes = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message))
    var messageHex = string2Hex(message);
    return ethers_1.ethers.utils.keccak256(messageHex);
}
function keccak256Hex(message) {
    return ethers_1.ethers.utils.keccak256(message);
}
function getDomainSeparator() {
    return keccak256Hex(EIP712_DOMAIN_TYPE_HASH + keccak256String('Mai Protocol v3').slice(2));
}
function getEIP712MessageHash(message) {
    var hash = keccak256Hex('0x1901' + getDomainSeparator().slice(2) + message.slice(2));
    return hash;
}
// make the result of eth_sign compatible with EIP155 where the v is either 27 or 28
function normalizeSign(sign) {
    if (sign.length != 132) {
        throw new Error('sign should consist up with 0x{r}{s}{v}');
    }
    var r = sign.slice(2, 2 + 64);
    var s = sign.slice(2 + 64, 2 + 128);
    var v = sign.slice(2 + 128);
    var tail = parseInt(v, 16);
    if (tail < 27) {
        v = (tail + 27).toString(16).toLowerCase();
    }
    return { r: r, s: s, v: v };
}
var UnsupportEIP712Error = /** @class */ (function (_super) {
    __extends(UnsupportEIP712Error, _super);
    function UnsupportEIP712Error() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UnsupportEIP712Error;
}(Error));
exports.UnsupportEIP712Error = UnsupportEIP712Error;
function signTypedDataV3(eip712Msg) {
    return __awaiter(this, void 0, void 0, function () {
        var from, params, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    from = this.address;
                    params = [from, JSON.stringify(eip712Msg)];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, this._web3Provider.send('eth_signTypedData_v3', params)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    e_1 = _a.sent();
                    // when connect to hardware wallet, it is not supported EIP
                    if (e_1.code === -32603) {
                        throw new UnsupportEIP712Error();
                    }
                    throw e_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function signOrder(wallet, orderHash, v3json) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, wallet.signMessage(ethers_1.ethers.utils.arrayify(orderHash))];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, {
                            signature: normalizeSign(result),
                            signType: SignType.EthSign
                        }];
            }
        });
    });
}
var EIP712_DOMAIN_TYPE_HASH = keccak256String('EIP712Domain(string name)');
var EIP712_ORDER_TYPE = keccak256String('Order(address trader,address broker,address relayer,address referrer,address liquidityPool,int256 minTradeAmount,int256 amount,int256 limitPrice,int256 triggerPrice,uint256 chainID,uint64 expiredAt,uint32 perpetualIndex,uint32 brokerFeeLimit,uint32 flags,uint32 salt)');
function getLeverageFlag(leverage) {
    return new bignumber_js_1["default"](new bignumber_js_1["default"](leverage).toFormat(2)).times(100).toNumber() << 7;
}
exports.getLeverageFlag = getLeverageFlag;
function getOrderFlag(orderType, isCloseOnly, leverage) {
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
    var orderFlag = 0;
    if (isCloseOnly) {
        orderFlag += TradeFlag.MASK_CLOSE_ONLY;
    }
    if (orderType == OrderTypeParams.StopOrder) {
        orderFlag += TradeFlag.MASK_STOP_LOSS_ORDER;
    }
    return orderFlag + getLeverageFlag(leverage);
}
exports.getOrderFlag = getOrderFlag;
function getOrderHash(orderParam) {
    var orderFlag = getOrderFlag(orderParam.orderType, orderParam.isCloseOnly, Number(orderParam.targetLeverage));
    var coder = ethers_1.ethers.utils.defaultAbiCoder;
    var result = coder.encode(['bytes32', 'address', 'address', 'address', 'address', 'address',
        'int256', 'int256', 'int256', 'int256', 'uint256',
        'uint64', 'uint32', 'uint32', 'uint32', 'uint32'], [EIP712_ORDER_TYPE,
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
        orderParam.brokerFeeLimit,
        Number(orderFlag),
        Number(orderParam.salt),
    ]);
    return getEIP712MessageHash(keccak256Hex(result));
}
exports.getOrderHash = getOrderHash;
//构建挂单请求的函数
function buildOrderRequestParamsDatas() {
    return __awaiter(this, void 0, void 0, function () {
        var orderParam, orderHash, orderFlag, v3json, privateKey, wallet, signOrderResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    orderParam = {
                        address: '0xF9758dB6571Cfe61e6eB9146D82A0f0FF7ACBc45'.toLowerCase(),
                        price: toWad('56000'),
                        triggerPrice: '0',
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
                        orderHash: '',
                        r: '',
                        s: '',
                        v: '',
                        signType: SignType.EthSign,
                        targetLeverage: '2.23'
                    };
                    orderHash = getOrderHash(orderParam);
                    orderFlag = getOrderFlag(orderParam.orderType, orderParam.isCloseOnly, Number(orderParam.targetLeverage));
                    v3json = {
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
                        salt: orderParam.salt.toString()
                    };
                    console.log(orderParam);
                    privateKey = '7f4fc6b1be03219f7f34bb0e4f12c2ff9983c08330defc8058fd949993c16281' // set your trader address private key for sign params
                    ;
                    wallet = new ethers_1.ethers.Wallet(privateKey);
                    return [4 /*yield*/, signOrder(wallet, orderHash, v3json)];
                case 1:
                    signOrderResult = _a.sent();
                    orderParam.orderHash = orderHash;
                    orderParam.r = signOrderResult.signature.r;
                    orderParam.s = signOrderResult.signature.s;
                    orderParam.v = signOrderResult.signature.v;
                    orderParam.signType = signOrderResult.signType;
                    // update date orderParam price and amount for backend
                    orderParam.amount = fromWad(orderParam.amount);
                    orderParam.price = fromWad(orderParam.price);
                    orderParam.minTradeAmount = fromWad(orderParam.minTradeAmount);
                    orderParam.triggerPrice = fromWad(orderParam.triggerPrice || '0');
                    return [2 /*return*/, orderParam];
            }
        });
    });
}
var APIClient = /** @class */ (function () {
    function APIClient(serverUrl, timeout) {
        if (timeout === void 0) { timeout = 20000; }
        this.axios = axios_1["default"].create({
            baseURL: serverUrl,
            timeout: timeout
        });
    }
    APIClient.prototype.request = function (config) {
        return this.axios.request(config);
    };
    APIClient.prototype.setHeader = function (options) {
        this.axios.defaults.headers = __assign(__assign({}, this.axios.defaults.headers), options);
    };
    APIClient.prototype.setResponseInterceptors = function (onFulfilled, onRejected) {
        this.axios.interceptors.response.use(onFulfilled, onRejected);
    };
    return APIClient;
}());
exports.APIClient = APIClient;
function placeOrder(requestParams) {
    return __awaiter(this, void 0, void 0, function () {
        var defaultRelayerServerAPIClient, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    defaultRelayerServerAPIClient = new APIClient("https://bsc.mcdex.io/api/");
                    return [4 /*yield*/, defaultRelayerServerAPIClient.request({
                            url: 'orders',
                            method: 'post',
                            data: requestParams
                        })];
                case 1:
                    result = (_a.sent());
                    return [2 /*return*/, result];
            }
        });
    });
}
exports.placeOrder = placeOrder;
function PlaceApiOrder() {
    return __awaiter(this, void 0, void 0, function () {
        var apiParams, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, buildOrderRequestParamsDatas()
                    //调用挂单函数，并获取结果
                ];
                case 1:
                    apiParams = _a.sent();
                    response = placeOrder(apiParams);
                    console.log(response);
                    return [2 /*return*/];
            }
        });
    });
}
// 进行挂单交易的函数
PlaceApiOrder();
