// Only securities already present in this asset pool; source workbook remains local.
globalThis.AssetPoolStatementPlan = {
  "id": "statement-20260910-v1",
  "source": "我的成交单.xlsx",
  "sheet": "Sheet1",
  "memberId": "m-self",
  "period": {
    "from": "2025-02-11",
    "through": "2026-09-08"
  },
  "assets": [
    {
      "id": "a-stock",
      "code": "600519",
      "name": "贵州茅台",
      "account": "长江"
    },
    {
      "id": "a-1785252824831-8d7531dd2ad11",
      "code": "HK0700",
      "name": "腾讯控股",
      "account": "长江"
    },
    {
      "id": "a-1785332500103-00664dc832a7f8",
      "code": "300750",
      "name": "宁德时代",
      "account": "长江"
    },
    {
      "id": "a-1785332635813-e93446ea574388",
      "code": "300760",
      "name": "迈瑞医疗",
      "account": "长江"
    },
    {
      "id": "a-1785333155820-c9a0284ea5b6f",
      "code": "600036",
      "name": "招商银行",
      "account": "长江"
    },
    {
      "id": "a-1785333341422-781a92b6c203c8",
      "code": "000333",
      "name": "美的集团",
      "account": "长江"
    },
    {
      "id": "a-1785333445445-7a6b9eaf78288",
      "code": "600887",
      "name": "伊利股份",
      "account": "长江"
    },
    {
      "id": "a-1787468380936-98265ff3740b18",
      "code": "HK9992",
      "name": "泡泡玛特",
      "account": "长江"
    }
  ],
  "transactions": [
    {
      "id": "t-1789049209943-faad673f3cb088",
      "before": {
        "id": "t-1789049209943-faad673f3cb088",
        "assetId": "a-1785333155820-c9a0284ea5b6f",
        "type": "卖出",
        "quantity": 300,
        "price": 41.09,
        "fee": 37.4,
        "fxRate": 0,
        "date": "2026-09-07",
        "reason": "",
        "recurring": false,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 300,
        "price": 41.09,
        "fee": 7.33,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 12327,
        "tradeTime": "13:26:28",
        "feeBreakdown": {
          "commission": 1.05,
          "stampDuty": 6.16,
          "other": 0.12
        },
        "sourceRef": "statement:changjiang:2026-09-07:600036:45987369",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 3,
          "tradeId": "45987369",
          "operation": "证券卖出",
          "amount": 12319.67
        }
      }
    },
    {
      "id": "t-1789049111535-f56dced0595608",
      "before": {
        "id": "t-1789049111535-f56dced0595608",
        "assetId": "a-1785332635813-e93446ea574388",
        "type": "卖出",
        "quantity": 200,
        "price": 169.65,
        "fee": 51.41,
        "fxRate": 0,
        "date": "2026-09-07",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 200,
        "price": 169.65,
        "fee": 20.21,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 33930,
        "tradeTime": "09:49:18",
        "feeBreakdown": {
          "commission": 2.9,
          "stampDuty": 16.97,
          "other": 0.34
        },
        "sourceRef": "statement:changjiang:2026-09-07:300760:103000013969270",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 4,
          "tradeId": "103000013969270",
          "operation": "证券卖出",
          "amount": 33909.79
        }
      }
    },
    {
      "id": "t-1789049180765-360c6a739656c",
      "before": {
        "id": "t-1789049180765-360c6a739656c",
        "assetId": "a-1785333155820-c9a0284ea5b6f",
        "type": "卖出",
        "quantity": 200,
        "price": 41.6,
        "fee": 25,
        "fxRate": 0,
        "date": "2026-09-07",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 200,
        "price": 41.6,
        "fee": 4.95,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 8320,
        "tradeTime": "09:43:57",
        "feeBreakdown": {
          "commission": 0.71,
          "stampDuty": 4.16,
          "other": 0.08
        },
        "sourceRef": "statement:changjiang:2026-09-07:600036:13037204",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 5,
          "tradeId": "13037204",
          "operation": "证券卖出",
          "amount": 8315.05
        }
      }
    },
    {
      "id": "t-1789049335226-f35ee75f1d53d",
      "before": {
        "id": "t-1789049335226-f35ee75f1d53d",
        "assetId": "a-1785333341422-781a92b6c203c8",
        "type": "卖出",
        "quantity": 100,
        "price": 87.76,
        "fee": 5.2,
        "fxRate": 0,
        "date": "2026-08-31",
        "reason": "",
        "recurring": false,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 87.76,
        "fee": 5.23,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 8776,
        "tradeTime": "09:58:18",
        "feeBreakdown": {
          "commission": 0.75,
          "stampDuty": 4.39,
          "other": 0.09
        },
        "sourceRef": "statement:changjiang:2026-08-31:333:105000022875463",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 7,
          "tradeId": "105000022875463",
          "operation": "证券卖出",
          "amount": 8770.77
        }
      }
    },
    {
      "id": "t-1789049283348-6f15de249b707",
      "before": {
        "id": "t-1789049283348-6f15de249b707",
        "assetId": "a-1785333341422-781a92b6c203c8",
        "type": "卖出",
        "quantity": 100,
        "price": 87.08,
        "fee": 81,
        "fxRate": 0,
        "date": "2026-08-31",
        "reason": "",
        "recurring": false,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 87.08,
        "fee": 5.18,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 8708,
        "tradeTime": "09:44:46",
        "feeBreakdown": {
          "commission": 0.74,
          "stampDuty": 4.35,
          "other": 0.09
        },
        "sourceRef": "statement:changjiang:2026-08-31:333:105000015293904",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 8,
          "tradeId": "105000015293904",
          "operation": "证券卖出",
          "amount": 8702.82
        }
      }
    },
    {
      "id": "t-1787470455441-ee34728432c558",
      "before": {
        "id": "t-1787470455441-ee34728432c558",
        "assetId": "a-1785333445445-7a6b9eaf78288",
        "type": "买入",
        "quantity": 100,
        "price": 25.05,
        "fee": 0.24,
        "fxRate": 0,
        "date": "2026-08-19",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 25.05,
        "fee": 0.24,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 2505,
        "tradeTime": "13:38:27",
        "feeBreakdown": {
          "commission": 0.21,
          "stampDuty": 0,
          "other": 0.03
        },
        "sourceRef": "statement:changjiang:2026-08-19:600887:59780823",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 175,
          "tradeId": "59780823",
          "operation": "证券买入",
          "amount": -2505.24
        }
      }
    },
    {
      "id": "t-1785332500103-7a29fa757fe82",
      "before": {
        "id": "t-1785332500103-7a29fa757fe82",
        "assetId": "a-1785332500103-00664dc832a7f8",
        "type": "买入",
        "quantity": 100,
        "price": 362,
        "fee": 4,
        "fxRate": 0,
        "date": "2026-07-10",
        "reason": "电池/储能龙头，市占率40%，回调了近20个点，PE大概21，净利润增长40%，港股溢价40%。\n国内对其错误定价。\n最坏打算，几年内利润翻倍然后回到10倍PE。\n",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 362,
        "fee": 3.45,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 36200,
        "tradeTime": "09:56:46",
        "feeBreakdown": {
          "commission": 3.09,
          "stampDuty": 0,
          "other": 0.36
        },
        "sourceRef": "statement:changjiang:2026-07-10:300750:102000023998788",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 201,
          "tradeId": "102000023998788",
          "operation": "证券买入",
          "amount": -36203.45
        }
      }
    },
    {
      "id": "t-1785333445445-1422dd5f41bc3",
      "before": {
        "id": "t-1785333445445-1422dd5f41bc3",
        "assetId": "a-1785333445445-7a6b9eaf78288",
        "type": "买入",
        "quantity": 100,
        "price": 26,
        "fee": 0.25,
        "fxRate": 0,
        "date": "2026-05-28",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 26,
        "fee": 0.25,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 2600,
        "tradeTime": "14:28:39",
        "feeBreakdown": {
          "commission": 0.22,
          "stampDuty": 0,
          "other": 0.03
        },
        "sourceRef": "statement:changjiang:2026-05-28:600887:67268896",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 209,
          "tradeId": "67268896",
          "operation": "证券买入",
          "amount": -2600.25
        }
      }
    },
    {
      "id": "t-1785333252496-759d636be5bfe",
      "before": {
        "id": "t-1785333252496-759d636be5bfe",
        "assetId": "a-1785333155820-c9a0284ea5b6f",
        "type": "买入",
        "quantity": 100,
        "price": 38.62,
        "fee": 0.37,
        "fxRate": 0,
        "date": "2026-04-29",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 38.62,
        "fee": 0.37,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 3862,
        "tradeTime": "10:34:39",
        "feeBreakdown": {
          "commission": 0.33,
          "stampDuty": 0,
          "other": 0.04
        },
        "sourceRef": "statement:changjiang:2026-04-29:600036:31926760",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 210,
          "tradeId": "31926760",
          "operation": "证券买入",
          "amount": -3862.37
        }
      }
    },
    {
      "id": "t-1785333230423-1f3c3e8b9612c8",
      "before": {
        "id": "t-1785333230423-1f3c3e8b9612c8",
        "assetId": "a-1785333155820-c9a0284ea5b6f",
        "type": "买入",
        "quantity": 100,
        "price": 38.8,
        "fee": 0.37,
        "fxRate": 0,
        "date": "2026-04-29",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 38.8,
        "fee": 0.37,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 3880,
        "tradeTime": "09:32:54",
        "feeBreakdown": {
          "commission": 0.33,
          "stampDuty": 0,
          "other": 0.04
        },
        "sourceRef": "statement:changjiang:2026-04-29:600036:4621923",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 211,
          "tradeId": "4621923",
          "operation": "证券买入",
          "amount": -3880.37
        }
      }
    },
    {
      "id": "t-1785333207376-dcbcb1d2368f78",
      "before": {
        "id": "t-1785333207376-dcbcb1d2368f78",
        "assetId": "a-1785333155820-c9a0284ea5b6f",
        "type": "买入",
        "quantity": 100,
        "price": 39.38,
        "fee": 0.38,
        "fxRate": 0,
        "date": "2026-04-27",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 39.38,
        "fee": 0.38,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 3938,
        "tradeTime": "14:45:41",
        "feeBreakdown": {
          "commission": 0.34,
          "stampDuty": 0,
          "other": 0.04
        },
        "sourceRef": "statement:changjiang:2026-04-27:600036:65198356",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 213,
          "tradeId": "65198356",
          "operation": "证券买入",
          "amount": -3938.38
        }
      }
    },
    {
      "id": "t-1785332713276-64f5af11da16e",
      "before": {
        "id": "t-1785332713276-64f5af11da16e",
        "assetId": "a-1785332635813-e93446ea574388",
        "type": "买入",
        "quantity": 100,
        "price": 158.1,
        "fee": 1.5,
        "fxRate": 0,
        "date": "2026-04-27",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 158.1,
        "fee": 1.51,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 15810,
        "tradeTime": "13:56:35",
        "feeBreakdown": {
          "commission": 1.35,
          "stampDuty": 0,
          "other": 0.16
        },
        "sourceRef": "statement:changjiang:2026-04-27:300760:103000064603940",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 214,
          "tradeId": "103000064603940",
          "operation": "证券买入",
          "amount": -15811.51
        }
      }
    },
    {
      "id": "t-1785333366244-85f2c34f848b58",
      "before": {
        "id": "t-1785333366244-85f2c34f848b58",
        "assetId": "a-1785333341422-781a92b6c203c8",
        "type": "买入",
        "quantity": 100,
        "price": 72.46,
        "fee": 0.69,
        "fxRate": 0,
        "date": "2026-03-30",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 72.46,
        "fee": 0.69,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 7246,
        "tradeTime": "09:54:34",
        "feeBreakdown": {
          "commission": 0.62,
          "stampDuty": 0,
          "other": 0.07
        },
        "sourceRef": "statement:changjiang:2026-03-30:333:105000019445987",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 223,
          "tradeId": "105000019445987",
          "operation": "证券买入",
          "amount": -7246.69
        }
      }
    },
    {
      "id": "t-1785332635813-8f46a0c2bb095",
      "before": {
        "id": "t-1785332635813-8f46a0c2bb095",
        "assetId": "a-1785332635813-e93446ea574388",
        "type": "买入",
        "quantity": 100,
        "price": 166.52,
        "fee": 1.6,
        "fxRate": 0,
        "date": "2026-03-23",
        "reason": "中国核心资产，弱周期，高ROE，转换成本高，国外市场扩张。短期受到国内医疗反腐影响，国外市场占比超过国内。但是仍是一个下跌趋势的票，买的时候PE大概在25左右。买在了合理估值，但没给自己留有安全边际。\n这段时间普遍的交易对于安全边际的理解不高。\n如果月线没站稳，这种最少短期需要3-4次建仓机会才合理。预想好最多加几次，核心那时候认知内也没太多优质的标的。",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 166.52,
        "fee": 1.59,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 16652,
        "tradeTime": "13:29:51",
        "feeBreakdown": {
          "commission": 1.42,
          "stampDuty": 0,
          "other": 0.17
        },
        "sourceRef": "statement:changjiang:2026-03-23:300760:103000060860330",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 230,
          "tradeId": "103000060860330",
          "operation": "证券买入",
          "amount": -16653.59
        }
      }
    },
    {
      "id": "t-1785333341422-b38cd09d645b6",
      "before": {
        "id": "t-1785333341422-b38cd09d645b6",
        "assetId": "a-1785333341422-781a92b6c203c8",
        "type": "买入",
        "quantity": 100,
        "price": 73,
        "fee": 0.69,
        "fxRate": 0,
        "date": "2026-03-23",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 73,
        "fee": 0.69,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 7300,
        "tradeTime": "11:29:33",
        "feeBreakdown": {
          "commission": 0.62,
          "stampDuty": 0,
          "other": 0.07
        },
        "sourceRef": "statement:changjiang:2026-03-23:333:103000050970433",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 231,
          "tradeId": "103000050970433",
          "operation": "证券买入",
          "amount": -7300.69
        }
      }
    },
    {
      "id": "t-1785333183742-35072eed6400b",
      "before": {
        "id": "t-1785333183742-35072eed6400b",
        "assetId": "a-1785333155820-c9a0284ea5b6f",
        "type": "买入",
        "quantity": 100,
        "price": 39,
        "fee": 0.37,
        "fxRate": 0,
        "date": "2026-03-23",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 39,
        "fee": 0.37,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 3900,
        "tradeTime": "10:22:41",
        "feeBreakdown": {
          "commission": 0.33,
          "stampDuty": 0,
          "other": 0.04
        },
        "sourceRef": "statement:changjiang:2026-03-23:600036:31692433",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 232,
          "tradeId": "31692433",
          "operation": "证券买入",
          "amount": -3900.37
        }
      }
    },
    {
      "id": "t-1785333155820-82057b8403dd8",
      "before": {
        "id": "t-1785333155820-82057b8403dd8",
        "assetId": "a-1785333155820-c9a0284ea5b6f",
        "type": "买入",
        "quantity": 100,
        "price": 39.77,
        "fee": 0.4,
        "fxRate": 0,
        "date": "2026-03-13",
        "reason": "反思：\n招商银行股息没到5.5不准建仓，他可以被认为是压舱石的资产，但是股息低于5.5一定不能建仓。 要留有富足的安全边际。\n对于红利的基金来说也是，股息5以上才可以加大定投的力度。\n股息低于5减少定投的金额，低于4.5更要减少，4停止定投。",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 39.77,
        "fee": 0.38,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 3977,
        "tradeTime": "14:40:13",
        "feeBreakdown": {
          "commission": 0.34,
          "stampDuty": 0,
          "other": 0.04
        },
        "sourceRef": "statement:changjiang:2026-03-13:600036:64397742",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 235,
          "tradeId": "64397742",
          "operation": "证券买入",
          "amount": -3977.38
        }
      }
    },
    {
      "id": "t-1785248794708-c457a703ae9f88",
      "before": {
        "id": "t-1785248794708-c457a703ae9f88",
        "assetId": "a-stock",
        "type": "买入",
        "quantity": 100,
        "price": 1466.9,
        "fee": 14,
        "fxRate": 0,
        "date": "2025-11-14",
        "reason": "购买逻辑：长期持有优质消费品牌\n反思：没考虑自己的资金量，建仓了一个大仓位的茅台，其并没有批价止跌，量止跌。 占个人仓位过重，且没有足够的安全边际。",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 1466.9,
        "fee": 14,
        "dividendTax": 0,
        "fxRate": 0,
        "grossAmountRmb": 146690,
        "tradeTime": "11:26:39",
        "feeBreakdown": {
          "commission": 12.53,
          "stampDuty": 0,
          "other": 1.47
        },
        "sourceRef": "statement:changjiang:2025-11-14:600519:34175743",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 241,
          "tradeId": "34175743",
          "operation": "证券买入",
          "amount": -146704
        }
      }
    },
    {
      "id": "t-1789049019439-8225fb1884bf98",
      "before": {
        "id": "t-1789049019439-8225fb1884bf98",
        "assetId": "a-1787468380936-98265ff3740b18",
        "type": "卖出",
        "quantity": 200,
        "price": 156.7,
        "fee": 33.62,
        "fxRate": 0.8557,
        "date": "2026-09-07",
        "reason": "",
        "recurring": false,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 200,
        "price": 156.7,
        "fee": 33.62,
        "dividendTax": 0,
        "fxRate": 0.85569,
        "grossAmountRmb": 26817.33,
        "tradeTime": "10:44:25",
        "feeBreakdown": {
          "commission": 2.82,
          "stampDuty": 27.38,
          "other": 3.42
        },
        "sourceRef": "statement:changjiang:2026-09-07:9992:9992000003722",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 544,
          "tradeId": "9992000003722",
          "operation": "证券卖出",
          "amount": 26783.71
        }
      }
    },
    {
      "id": "t-1785252824831-ac9bf1aec4d89",
      "before": {
        "id": "t-1785252824831-ac9bf1aec4d89",
        "assetId": "a-1785252824831-8d7531dd2ad11",
        "type": "买入",
        "quantity": 100,
        "price": 503,
        "fee": 183.08,
        "fxRate": 0.8753,
        "date": "2026-03-23",
        "reason": "第一天建仓了4手腾讯，几乎打光了那天的投资资金。\n一个再好的核心标的，你也要有耐心，耐心的等待，在一段时间内均匀的建仓，不应该一次建仓这么多，而且这个票是在一个下跌趋势，月线还没有站稳几根，就选择贸然的加仓，即使短期上来，也很难很快的突破，因为上方有大量的套牢盘。保持耐心，建仓时间拉长，投资一个好的标的会有大量的好机会，那时候对于市场的认识也相对较浅，认知里也没几个备选，所以，认知里得有几个备选的优质标的，等待其安全价位的出现。",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 503,
        "fee": 183.08,
        "dividendTax": 0,
        "fxRate": 0.87893,
        "grossAmountRmb": 44210.17,
        "tradeTime": "09:44:32",
        "feeBreakdown": {
          "commission": 132.63,
          "stampDuty": 44.82,
          "other": 5.63
        },
        "sourceRef": "statement:changjiang:2026-03-23:700:700000015524",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 545,
          "tradeId": "700000015524",
          "operation": "证券买入",
          "amount": -44393.25
        }
      }
    },
    {
      "id": "t-1785252875280-ac4fb21ce4fa08",
      "before": {
        "id": "t-1785252875280-ac4fb21ce4fa08",
        "assetId": "a-1785252824831-8d7531dd2ad11",
        "type": "买入",
        "quantity": 100,
        "price": 500.5,
        "fee": 182.39,
        "fxRate": 0.8753,
        "date": "2026-03-23",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 500.5,
        "fee": 182.39,
        "dividendTax": 0,
        "fxRate": 0.87893,
        "grossAmountRmb": 43990.44,
        "tradeTime": "10:32:14",
        "feeBreakdown": {
          "commission": 131.97,
          "stampDuty": 44.82,
          "other": 5.6
        },
        "sourceRef": "statement:changjiang:2026-03-23:700:700000029372",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 546,
          "tradeId": "700000029372",
          "operation": "证券买入",
          "amount": -44172.83
        }
      }
    },
    {
      "id": "t-1785252906826-749ebbda2d29b8",
      "before": {
        "id": "t-1785252906826-749ebbda2d29b8",
        "assetId": "a-1785252824831-8d7531dd2ad11",
        "type": "买入",
        "quantity": 100,
        "price": 498.4,
        "fee": 180.93,
        "fxRate": 0.8753,
        "date": "2026-03-23",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 498.4,
        "fee": 180.93,
        "dividendTax": 0,
        "fxRate": 0.87893,
        "grossAmountRmb": 43805.87,
        "tradeTime": "13:52:25",
        "feeBreakdown": {
          "commission": 131.42,
          "stampDuty": 43.94,
          "other": 5.57
        },
        "sourceRef": "statement:changjiang:2026-03-23:700:700000058152",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 547,
          "tradeId": "700000058152",
          "operation": "证券买入",
          "amount": -43986.8
        }
      }
    },
    {
      "id": "t-1785252934180-de2df8daa51a6",
      "before": {
        "id": "t-1785252934180-de2df8daa51a6",
        "assetId": "a-1785252824831-8d7531dd2ad11",
        "type": "买入",
        "quantity": 100,
        "price": 498,
        "fee": 180.81,
        "fxRate": 0.8753,
        "date": "2026-03-23",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 498,
        "fee": 180.81,
        "dividendTax": 0,
        "fxRate": 0.87893,
        "grossAmountRmb": 43770.71,
        "tradeTime": "14:10:23",
        "feeBreakdown": {
          "commission": 131.31,
          "stampDuty": 43.94,
          "other": 5.56
        },
        "sourceRef": "statement:changjiang:2026-03-23:700:700000062788",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 548,
          "tradeId": "700000062788",
          "operation": "证券买入",
          "amount": -43951.52
        }
      }
    },
    {
      "id": "t-1785252957689-725a5e1f231eb",
      "before": {
        "id": "t-1785252957689-725a5e1f231eb",
        "assetId": "a-1785252824831-8d7531dd2ad11",
        "type": "买入",
        "quantity": 100,
        "price": 474.2,
        "fee": 51.4,
        "fxRate": 0.87,
        "date": "2026-04-28",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 474.2,
        "fee": 51.4,
        "dividendTax": 0,
        "fxRate": 0.87107,
        "grossAmountRmb": 41306.13,
        "tradeTime": "14:55:06",
        "feeBreakdown": {
          "commission": 4.34,
          "stampDuty": 41.81,
          "other": 5.25
        },
        "sourceRef": "statement:changjiang:2026-04-28:700:700000070976",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 553,
          "tradeId": "700000070976",
          "operation": "证券买入",
          "amount": -41357.53
        }
      }
    },
    {
      "id": "t-1785252978545-ac46943bcbd3e8",
      "before": {
        "id": "t-1785252978545-ac46943bcbd3e8",
        "assetId": "a-1785252824831-8d7531dd2ad11",
        "type": "买入",
        "quantity": 100,
        "price": 462,
        "fee": 50.06,
        "fxRate": 0.866,
        "date": "2026-05-14",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 462,
        "fee": 50.06,
        "dividendTax": 0,
        "fxRate": 0.86707,
        "grossAmountRmb": 40058.63,
        "tradeTime": "11:56:08",
        "feeBreakdown": {
          "commission": 4.21,
          "stampDuty": 40.75,
          "other": 5.1
        },
        "sourceRef": "statement:changjiang:2026-05-14:700:700000064300",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 554,
          "tradeId": "700000064300",
          "operation": "证券买入",
          "amount": -40108.69
        }
      }
    },
    {
      "id": "t-1785253128712-39978a42b08b88",
      "before": {
        "id": "t-1785253128712-39978a42b08b88",
        "assetId": "a-1785252824831-8d7531dd2ad11",
        "type": "买入",
        "quantity": 100,
        "price": 417.2,
        "fee": 44.7,
        "fxRate": 0.8638,
        "date": "2026-06-23",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 417.2,
        "fee": 44.7,
        "dividendTax": 0,
        "fxRate": 0.86485,
        "grossAmountRmb": 36081.54,
        "tradeTime": "11:10:18",
        "feeBreakdown": {
          "commission": 3.79,
          "stampDuty": 36.32,
          "other": 4.59
        },
        "sourceRef": "statement:changjiang:2026-06-23:700:700000050881",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 555,
          "tradeId": "700000050881",
          "operation": "证券买入",
          "amount": -36126.24
        }
      }
    },
    {
      "id": "t-1787468380936-b372385faec73",
      "before": {
        "id": "t-1787468380936-b372385faec73",
        "assetId": "a-1787468380936-98265ff3740b18",
        "type": "买入",
        "quantity": 200,
        "price": 151.5,
        "fee": 32.71,
        "fxRate": 0.8552,
        "date": "2026-08-12",
        "reason": "",
        "recurring": true,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 200,
        "price": 151.5,
        "fee": 32.71,
        "dividendTax": 0,
        "fxRate": 0.85991,
        "grossAmountRmb": 26055.27,
        "tradeTime": "13:34:24",
        "feeBreakdown": {
          "commission": 2.74,
          "stampDuty": 26.65,
          "other": 3.32
        },
        "sourceRef": "statement:changjiang:2026-08-12:9992:9992000010499",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 556,
          "tradeId": "9992000010499",
          "operation": "证券买入",
          "amount": -26087.98
        }
      }
    },
    {
      "id": "t-1789050666796-e9d51a25d0d898",
      "before": {
        "id": "t-1789050666796-e9d51a25d0d898",
        "assetId": "a-1785252824831-8d7531dd2ad11",
        "type": "买入",
        "quantity": 100,
        "price": 435.6,
        "fee": 46.4,
        "fxRate": 0.8576,
        "date": "2026-09-02",
        "reason": "",
        "recurring": false,
        "dividendTax": 0
      },
      "changes": {
        "quantity": 100,
        "price": 435.6,
        "fee": 46.41,
        "dividendTax": 0,
        "fxRate": 0.85759,
        "grossAmountRmb": 37356.62,
        "tradeTime": "09:37:08",
        "feeBreakdown": {
          "commission": 3.92,
          "stampDuty": 37.73,
          "other": 4.76
        },
        "sourceRef": "statement:changjiang:2026-09-02:700:700000008227",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 557,
          "tradeId": "700000008227",
          "operation": "证券买入",
          "amount": -37403.03
        }
      }
    }
  ],
  "cashflows": [
    {
      "id": "c-1787467944043-1978a56c945c6",
      "before": {
        "id": "c-1787467944043-1978a56c945c6",
        "sourceRef": "auto:div:600036:2026-07-10",
        "assetId": "a-1785333155820-c9a0284ea5b6f",
        "incomeKind": "分红",
        "name": "招商银行 分红",
        "type": "资产现金流",
        "amount": 501.5,
        "date": "2026-07-10",
        "sustainable": true,
        "recurring": true,
        "note": "自动同步：每份分红 1.003 元 × 持仓 500（除息 2026-07-10，含税）",
        "recordDate": "2026-07-09",
        "exDate": "2026-07-10"
      },
      "changes": {
        "amount": 501.5,
        "date": "2026-07-09",
        "sourceRef": "statement:changjiang:income:2026-07-09:600036:523",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 523,
          "tradeId": "0",
          "operation": "股息入账",
          "amount": 501.5
        },
        "note": "自动同步：每份分红 1.003 元 × 持仓 500（除息 2026-07-10，含税）；券商成交单第 523 行确认到账"
      }
    },
    {
      "id": "c-1787467075454-649baef83df85",
      "before": {
        "id": "c-1787467075454-649baef83df85",
        "sourceRef": "auto:div:600887:2026-06-05",
        "assetId": "a-1785333445445-7a6b9eaf78288",
        "incomeKind": "分红",
        "name": "伊利股份 分红",
        "type": "资产现金流",
        "amount": 90,
        "date": "2026-06-05",
        "sustainable": true,
        "recurring": true,
        "note": "自动同步：每份分红 0.9 元 × 持仓 100（除息 2026-06-05，含税）",
        "recordDate": "2026-06-04",
        "exDate": "2026-06-05"
      },
      "changes": {
        "amount": 90,
        "date": "2026-06-04",
        "sourceRef": "statement:changjiang:income:2026-06-04:600887:524",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 524,
          "tradeId": "0",
          "operation": "股息入账",
          "amount": 90
        },
        "note": "自动同步：每份分红 0.9 元 × 持仓 100（除息 2026-06-05，含税）；券商成交单第 524 行确认到账"
      }
    },
    {
      "id": "c-1787468250054-47aae071206d58",
      "before": {
        "id": "c-1787468250054-47aae071206d58",
        "sourceRef": "auto:div:300750:2026-08-10",
        "assetId": "a-1785332500103-00664dc832a7f8",
        "incomeKind": "分红",
        "name": "宁德时代 分红",
        "type": "资产现金流",
        "amount": 141.1,
        "date": "2026-08-10",
        "sustainable": true,
        "recurring": true,
        "note": "自动同步：每份分红 1.411 元 × 持仓 100（除息 2026-08-10，含税）",
        "recordDate": "2026-08-07",
        "exDate": "2026-08-10"
      },
      "changes": {
        "amount": 141.1,
        "date": "2026-08-07",
        "sourceRef": "statement:changjiang:income:2026-08-07:300750:525",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 525,
          "tradeId": "57093",
          "operation": "股息入账",
          "amount": 141.1
        },
        "note": "自动同步：每份分红 1.411 元 × 持仓 100（除息 2026-08-10，含税）；券商成交单第 525 行确认到账"
      }
    },
    {
      "id": "c-1787468250226-564adecc1c7928",
      "before": {
        "id": "c-1787468250226-564adecc1c7928",
        "sourceRef": "auto:div:000333:2026-06-29",
        "assetId": "a-1785333341422-781a92b6c203c8",
        "incomeKind": "分红",
        "name": "美的集团 分红",
        "type": "资产现金流",
        "amount": 760,
        "date": "2026-06-29",
        "sustainable": true,
        "recurring": true,
        "note": "自动同步：每份分红 3.8 元 × 持仓 200（除息 2026-06-29，含税）",
        "recordDate": "2026-06-26",
        "exDate": "2026-06-29"
      },
      "changes": {
        "amount": 760,
        "date": "2026-06-26",
        "sourceRef": "statement:changjiang:income:2026-06-26:333:526",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 526,
          "tradeId": "4991",
          "operation": "股息入账",
          "amount": 760
        },
        "note": "自动同步：每份分红 3.8 元 × 持仓 200（除息 2026-06-29，含税）；券商成交单第 526 行确认到账"
      }
    },
    {
      "id": "c-1787469411074-afac837f40cea8",
      "before": {
        "id": "c-1787469411074-afac837f40cea8",
        "sourceRef": "auto:div:300760:2026-05-28",
        "assetId": "a-1785332635813-e93446ea574388",
        "incomeKind": "分红",
        "name": "迈瑞医疗 分红",
        "type": "资产现金流",
        "amount": 312,
        "date": "2026-05-28",
        "sustainable": true,
        "recurring": true,
        "note": "自动同步：每份分红 1.56 元 × 持仓 200（除息 2026-05-28，同日 2 笔分红合并，含税）",
        "recordDate": "2026-05-27",
        "exDate": "2026-05-28"
      },
      "changes": {
        "amount": 312,
        "date": "2026-05-27",
        "sourceRef": "statement:changjiang:income:2026-05-27:300760:527",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 527,
          "tradeId": "114046",
          "operation": "股息入账",
          "amount": 312
        },
        "note": "自动同步：每份分红 1.56 元 × 持仓 200（除息 2026-05-28，同日 2 笔分红合并，含税）；券商成交单第 527 行确认到账"
      }
    },
    {
      "id": "c-1787466697704-9aeade0ebc3c6",
      "before": {
        "id": "c-1787466697704-9aeade0ebc3c6",
        "sourceRef": "auto:div:600519:2025-12-19",
        "assetId": "a-stock",
        "incomeKind": "分红",
        "name": "贵州茅台 分红",
        "type": "资产现金流",
        "amount": 2395.7,
        "date": "2025-12-19",
        "sustainable": true,
        "recurring": true,
        "note": "自动同步：每份分红 23.957 元 × 持仓 100（除息 2025-12-19，含税）",
        "recordDate": "2025-12-18",
        "exDate": "2025-12-19"
      },
      "changes": {
        "amount": 2395.7,
        "date": "2025-12-18",
        "sourceRef": "statement:changjiang:income:2025-12-18:600519:530",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 530,
          "tradeId": "0",
          "operation": "股息入账",
          "amount": 2395.7
        },
        "note": "自动同步：每份分红 23.957 元 × 持仓 100（除息 2025-12-19，含税）；券商成交单第 530 行确认到账"
      }
    },
    {
      "id": "c-1787466697704-721173ae1f9ba",
      "before": {
        "id": "c-1787466697704-721173ae1f9ba",
        "sourceRef": "auto:div:600519:2026-06-26",
        "assetId": "a-stock",
        "incomeKind": "分红",
        "name": "贵州茅台 分红",
        "type": "资产现金流",
        "amount": 2802.42,
        "date": "2026-06-26",
        "sustainable": true,
        "recurring": true,
        "note": "自动同步：每份分红 28.02423 元 × 持仓 100（除息 2026-06-26，含税）",
        "recordDate": "2026-06-25",
        "exDate": "2026-06-26"
      },
      "changes": {
        "amount": 2802.42,
        "date": "2026-06-25",
        "sourceRef": "statement:changjiang:income:2026-06-25:600519:531",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 531,
          "tradeId": "0",
          "operation": "股息入账",
          "amount": 2802.42
        },
        "note": "自动同步：每份分红 28.02423 元 × 持仓 100（除息 2026-06-26，含税）；券商成交单第 531 行确认到账"
      }
    },
    {
      "id": "c-1785253099303-b8c2ebaf5ef238",
      "before": {
        "id": "c-1785253099303-b8c2ebaf5ef238",
        "assetId": "a-1785252824831-8d7531dd2ad11",
        "incomeKind": "分红",
        "name": "腾讯控股 分红",
        "type": "资产现金流",
        "amount": 2191,
        "date": "2026-06-02",
        "sustainable": true,
        "recurring": true,
        "note": "分红已对半分给陈童"
      },
      "changes": {
        "amount": 2191.4,
        "date": "2026-06-02",
        "sourceRef": "statement:changjiang:income:2026-06-02:700:558",
        "statementSource": {
          "file": "我的成交单.xlsx",
          "sheet": "Sheet1",
          "row": 558,
          "tradeId": "8794",
          "operation": "股息入账",
          "amount": 2191.4
        },
        "note": "分红已对半分给陈童；券商成交单第 558 行确认到账"
      }
    }
  ],
  "newTransactions": [
    {
      "id": "t-statement-20260910-row-536",
      "assetId": "a-1785333155820-c9a0284ea5b6f",
      "type": "红利税",
      "quantity": 0,
      "price": 0,
      "fee": 0,
      "dividendTax": 10.03,
      "fxRate": 0,
      "date": "2026-09-08",
      "tradeTime": "00:00:00",
      "reason": "券商独立扣税记录；按实际扣款日入账",
      "recurring": false,
      "sourceRef": "statement:changjiang:tax:2026-09-08:600036:536",
      "statementSource": {
        "file": "我的成交单.xlsx",
        "sheet": "Sheet1",
        "row": 536,
        "tradeId": "",
        "operation": "股息红利税补缴",
        "amount": -10.03
      }
    },
    {
      "id": "t-statement-20260910-row-537",
      "assetId": "a-1785333155820-c9a0284ea5b6f",
      "type": "红利税",
      "quantity": 0,
      "price": 0,
      "fee": 0,
      "dividendTax": 10.03,
      "fxRate": 0,
      "date": "2026-09-08",
      "tradeTime": "00:00:00",
      "reason": "券商独立扣税记录；按实际扣款日入账",
      "recurring": false,
      "sourceRef": "statement:changjiang:tax:2026-09-08:600036:537",
      "statementSource": {
        "file": "我的成交单.xlsx",
        "sheet": "Sheet1",
        "row": 537,
        "tradeId": "",
        "operation": "股息红利税补缴",
        "amount": -10.03
      }
    },
    {
      "id": "t-statement-20260910-row-538",
      "assetId": "a-1785333155820-c9a0284ea5b6f",
      "type": "红利税",
      "quantity": 0,
      "price": 0,
      "fee": 0,
      "dividendTax": 10.03,
      "fxRate": 0,
      "date": "2026-09-08",
      "tradeTime": "00:00:00",
      "reason": "券商独立扣税记录；按实际扣款日入账",
      "recurring": false,
      "sourceRef": "statement:changjiang:tax:2026-09-08:600036:538",
      "statementSource": {
        "file": "我的成交单.xlsx",
        "sheet": "Sheet1",
        "row": 538,
        "tradeId": "",
        "operation": "股息红利税补缴",
        "amount": -10.03
      }
    },
    {
      "id": "t-statement-20260910-row-539",
      "assetId": "a-1785333155820-c9a0284ea5b6f",
      "type": "红利税",
      "quantity": 0,
      "price": 0,
      "fee": 0,
      "dividendTax": 20.06,
      "fxRate": 0,
      "date": "2026-09-08",
      "tradeTime": "00:00:00",
      "reason": "券商独立扣税记录；按实际扣款日入账",
      "recurring": false,
      "sourceRef": "statement:changjiang:tax:2026-09-08:600036:539",
      "statementSource": {
        "file": "我的成交单.xlsx",
        "sheet": "Sheet1",
        "row": 539,
        "tradeId": "",
        "operation": "股息红利税补缴",
        "amount": -20.06
      }
    },
    {
      "id": "t-statement-20260910-row-540",
      "assetId": "a-1785332635813-e93446ea574388",
      "type": "红利税",
      "quantity": 0,
      "price": 0,
      "fee": 0,
      "dividendTax": 31.2,
      "fxRate": 0,
      "date": "2026-09-08",
      "tradeTime": "00:00:00",
      "reason": "券商独立扣税记录；按实际扣款日入账",
      "recurring": false,
      "sourceRef": "statement:changjiang:tax:2026-09-08:300760:540",
      "statementSource": {
        "file": "我的成交单.xlsx",
        "sheet": "Sheet1",
        "row": 540,
        "tradeId": "",
        "operation": "股息红利税补缴",
        "amount": -31.2
      }
    },
    {
      "id": "t-statement-20260910-row-542",
      "assetId": "a-1785333341422-781a92b6c203c8",
      "type": "红利税",
      "quantity": 0,
      "price": 0,
      "fee": 0,
      "dividendTax": 76,
      "fxRate": 0,
      "date": "2026-09-01",
      "tradeTime": "00:00:00",
      "reason": "券商独立扣税记录；按实际扣款日入账",
      "recurring": false,
      "sourceRef": "statement:changjiang:tax:2026-09-01:333:542",
      "statementSource": {
        "file": "我的成交单.xlsx",
        "sheet": "Sheet1",
        "row": 542,
        "tradeId": "",
        "operation": "股息红利税补缴",
        "amount": -76
      }
    }
  ],
  "omittedRows": 515
};
