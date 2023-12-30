from __future__ import (absolute_import, division, print_function,
                        unicode_literals)
import os
import pickle
import warnings
import pymongo
import numpy as np
import pandas as pd
import ccxt
from ccxt.base.errors import InvalidNonce, BadSymbol

from datetime import datetime  # For datetime objects
import sys  # To find out the script name (in argv[0])
from tqdm.auto import tqdm

# Import the backtrader platform
import backtrader as bt
import matplotlib
import time
import keyboard

matplotlib.use('Agg')


# prevent this warning:Matplotlib is currently using agg, which is a non-GUI backend, so cannot show the figure.
warnings.filterwarnings("ignore", category=UserWarning, module="backtrader")

# Create a Stratey
class TestStrategy(bt.Strategy):

    def log(self, txt, dt=None):
        ''' Logging function for this strategy'''
        dt = dt or self.datas[0].datetime.date(0)
        print('%s, %s' % (dt.isoformat(), txt))

    def __init__(self):
        # Keep a reference to the "close" line in the data[0] dataseries
        self.dataclose = self.datas[0].close

    def next(self):
        # Simply log the closing price of the series from the reference
        self.log('Close, %.2f' % self.dataclose[0])


class CrossoverStrategy(bt.Strategy):
    params = {
        "name": "CrossoverStrategy",
        "fast_period": 9,
        "slow_period": 45,
    }

    def __init__(self):
        ma_fast = bt.ind.SMA(period=self.params.fast_period)
        ma_slow = bt.ind.SMA(period=self.params.slow_period)

        # self.crossover = bt.ind.CrossOver(ma_fast, ma_slow)
        self.crossover = bt.ind.CrossOver(ma_fast, ma_slow)

    def next(self):
        if not self.position:
            if self.crossover > 0:
                self.buy()
        elif self.crossover < 0:
            self.close()


class BullishAlignmentStrategy(bt.Strategy):
    params = {
        "name": "BullishAlignmentStrategy",
        'ma_ref': [5, 20, 60]
    }

    def __init__(self):
        self.ma_list = [bt.ind.SMA(period=ma) for ma in self.params.ma_ref]

        # if MA5 > MA20 > MA60, then buy

    def next(self):
        bullish_align = True
        for i in range(len(self.ma_list) - 1):
            if self.ma_list[i] < self.ma_list[i+1]:
                bullish_align = False
                break
        if not self.position:
            if bullish_align:
                self.buy()
        else:
            if not bullish_align:
                self.close()


class TurnoverRankStrategy(bt.Strategy):
    params = {
        "name": "TurnoverRankStrategy",
    }
    # this strategy will buy the top 10 stocks with the highest turnover
    # exclude weighted stock (weighted higher than 4 percent in twse index)

    def __init__(self, stock_num, turnover_rank, weighted_stock, weight_threshold=0.04, method=1):
        # this is a dictionary with date as key and a list of stock_num as value
        self.turnover_rank = turnover_rank

        self.stock_num = stock_num

        self.method = method

        # find through the weight according t o the stock number in WEIGHTED_STOCK
        # if the weight is higher than 4 percent, then exclude it
        # if the weight is lower than 4 percent, then include it
        try:
            self.weight = float(weighted_stock.at[int(
                self.stock_num), "市值佔 大盤比重"][:-1])/100
        except:
            print(weighted_stock)
            raise
        self.is_weighted = self.weight >= weight_threshold
        ma = bt.ind.SMA(period=3)
        self.crossover = bt.ind.CrossOver(self.data.close, ma)

        self.order = None

    def next(self):
        # get today's date
        today = self.datetime.date(0)

        # turn datetime.date into pandas timestamp
        today_timestamp = pd.to_datetime(today)

        if not self.position:
            # if today is in the turnover_rank and self.is_weighted is False, buy the stock
            if not self.is_weighted:
                if self.stock_num in self.turnover_rank[today_timestamp]:
                    self.order = self.buy()
        else:
            # method 1: sell the stock if the stock is lower than ma3
            if self.method == 1:
                if self.crossover < 0:
                    self.sell()
            elif self.method == 2:
                # method 2: sell the stock either if the stock is 3% higher than the buy price
                # or if the stock prices of recent three days are lower than 4 days ago

                if self.data.close[0] >= self.order.executed.price * 1.05:
                    self.sell()
                    self.order = None
                else:
                    higher = False
                    for i in range(3):
                        if self.data.close[-i] >= self.data.close[-3]:
                            higher = True
                            break

                    if not higher:
                        self.sell()
                        self.order = None


class CashPercent(bt.Sizer):
    params = (
        ('percent', 0.5),
    )

    def _getsizing(self, comminfo, cash, data, isbuy):
        if isbuy:
            return int(cash * self.p.percent / data.close[0])
        else:
            return self.broker.getposition(data).size

class BbandMaStrategy(bt.Strategy):
    params = {
        "name": "BbandMaStrategy",
        "devfactor": 2,
        "ma_period": 60,
        "bband_period": 10,
        "target": 0.5
        }

    def __init__(self):
        self.bband = bt.ind.BBands(
            self.data.close,
            period=self.params.bband_period, devfactor=self.params.devfactor
        )
        self.ma = bt.ind.SMA(period=self.p.ma_period)

        self.init_cash = self.broker.get_cash()

        # price cross under the middle band and above ma
        self.buy_sig_1 = bt.ind.CrossOver(self.bband.lines.mid, self.data.close)
        # price cross under the lower band and above ma
        self.buy_sig_2 = bt.ind.CrossOver(self.bband.lines.bot, self.data.close)

        # price cross the middle band
        self.sell_sig_1 = bt.ind.CrossOver(self.data.close, self.bband.lines.mid)
        # price cross the upper band
        self.sell_sig_2 = bt.ind.CrossOver(self.data.close, self.bband.lines.top)

        # self.rsi = bt.ind.RSI_SMA(period=14)

        self.status = "na"

    # Define the logic for each bar
    def next(self):
        price = self.data.close[0]
        target_size = self.init_cash / price
        now_size = self.broker.getposition(self.data).size
        
        if self.buy_sig_1 and self.status != "b1" and price > self.ma[0]:
            self.buy(size=target_size * 0.2)
            self.status = "b1"
        if self.buy_sig_2 and self.status != "b2" and price > self.ma[0]:
            self.buy(size=target_size * 0.8)
            self.status = "b2"
        if self.sell_sig_1 and self.status != "s1":
            if now_size >= target_size * 0.2:
                self.sell(size=target_size * 0.2)
                self.status = "s1"
        if self.sell_sig_2 and self.status != "s2":
            if now_size >= target_size * 0.8:
                self.sell(size=target_size * 0.8)
                self.status = "s2"

class FibonRetraceStrategy(bt.Strategy):
    params = {
        "name": "FibonRetraceStrategy",
        "ma_period": 120,
        "retrace_period": 60,
        "min_gap": 0.1,  # the gap between the max price and min price should be at least n percent
        "noise": 0.1
        }
    def __init__(self):
        self.ma = bt.ind.SMA(period=self.p.ma_period)
    
    def next(self):
        if len(self.data) < self.p.retrace_period:
            return

        close_prices = self.data.close.get(size=len(self.data.close))
        max_index = np.argmax(close_prices)
        max_price = close_prices[max_index]
        min_index = np.argmin(close_prices)
        min_price = close_prices[min_index]

        # get the gap between the highest price and lowest price
        price_diff = max_price - min_price
        gap = price_diff / min_price
        threshold = max_price - 0.62 * price_diff # 0.618 is the golden ratio
        now_noise = abs(self.data.close[0] - threshold) / threshold

        # get all prices between max_index and now index
        max_prices_to_now = self.data.close.get(size=len(self.data.close) - max_index, ago=-1)

        # if one of the prices is lower than now price, return
        if np.argmin(max_prices_to_now) < self.data.close[0]:
            return

        if gap < self.p.min_gap or max_index <= min_index or now_noise > self.p.noise:
            return

        if not self.position:
            if self.data.close[0] >= self.ma[0]:
                # buy with 10% of stop loss
                self.buy()
        else:
            # get the buying price
            buy_price = self.broker.getposition(self.data).price
            # if the price is 10% lower than the buying price, sell
            if self.data.close[0] <= buy_price * 0.9:
                self.sell()
            elif self.data.close[0] >= buy_price * 1.3:
                self.sell()

class Backtester:
    def __init__(self, start_time, end_time):  # like 2020-01-01
        self.start_time = start_time
        self.end_time = end_time
    
        self._exit_program = False
        self._price_data = None
        self._data_type = None
        self._data_kwargs = None

    def _set_exit_program(self):
        self._exit_program = True

    def _set_price_data(self, price_data, data_type, price_data_kwargs):
        self._price_data = price_data
        self._data_type = data_type
        self._data_kwargs = price_data_kwargs

    def _buy_and_hold(self, sign):
        # the last day's close price / the first day's close price - 1
        return self._price_data[sign].iloc[-1, 3] / self._price_data[sign].iloc[0, 3] - 1
    
    def execute(self, sign, my_strategy, my_strategy_kwgs={}, plot=False):
        # if self._price_data, self._data_type, self._data_kwargs is None raise error
        if self._price_data is None or self._data_type is None or self._data_kwargs is None:
            raise ValueError("price_data, data_type, data_kwargs should be set first")

        # Create a cerebro entity
        cerebro = bt.Cerebro()

        # Add a strategｙ
        # cerebro.addstrategy(TurnoverRankStrategy, stock_num=stock_num, \
        #                     turnover_rank=self._turnover_rank, \
        #                         weighted_stock=self._weighted_stock, \
        #                             method=2)

        # cerebro.addstrategy(CrossoverStrategy)

        cerebro.addstrategy(my_strategy, **my_strategy_kwgs)

        # Add the Data Feed to Cerebro
        cerebro.adddata(self._data_type(dataname=self._price_data[sign], **self._data_kwargs))

        # Set our desired cash start
        cerebro.broker.setcash(100000.0)
        
        # set commission
        cerebro.broker.setcommission(commission=0)

        # analyzer
        cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name='mysharpe')
        # cerebro.addanalyzer(bt.analyzers.DrawDown, _name='mydrawdown')
        cerebro.addanalyzer(bt.analyzers.Returns, _name='myreturn')
        cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name='mytrade')
        cerebro.addanalyzer(bt.analyzers.Transactions, _name='mytransactions')

        try:
            # Run over everything
            result = cerebro.run(runonce=True)
        except IndexError:
            return None

        # get analyzer
        mysharpe = result[0].analyzers.mysharpe.get_analysis()
        myreturn = result[0].analyzers.myreturn.get_analysis()
        mytrade = result[0].analyzers.mytrade.get_analysis()
        
        # get all transactions
        mytransactions = result[0].analyzers.mytransactions.get_analysis()
        
        # # print analyzer
        # print('Sharpe Ratio:', mysharpe['sharperatio'])
        # print('Total Return:', myreturn['rtot'])
        # print('Total Trades:', mytrade['total'])
        # Plot the result and save the image under /backtest_result/
        if plot:
            # plot and save the image under /backtest_result/
            fig = cerebro.plot(style='bar', barup='red', bardown='black', volup='red', voldown='black', tight=True, iplot=False)[0][0]

            try:
                fig.set_size_inches(20, 10)  # _tkinter.TclError: invalid command name ".!canvas
            except:
                pass
            fig.savefig(f'backtest_result//{sign}_{self.start_time}_{self.end_time}_{my_strategy.params.name}.png', bbox_inches="tight")

        result = {
            "sharperatio": mysharpe['sharperatio'], 
            "return": myreturn['rtot'], 
            "buy_and_hold return": self._buy_and_hold(sign),
            "trades":mytrade, 
            "transactions": mytransactions
        }

        return result
    
    def execute_all(self, my_strategy, my_strategy_kwgs={}, plot=False):
        all_results = {}

        keyboard.add_hotkey("esc", self._set_exit_program)

        # construct a tqdm progress and set green color
        tqdm.write("--- press ESC to exit the program ---\n")
        pbar = tqdm(total=len(self._price_data), desc=f"running {my_strategy.params.name}",
                    colour="green", position=0, leave=True)
    
        # execute all the stocks
        for sign in self._price_data:
            pbar.set_postfix({"now-running": sign})
            pbar.refresh()

            try:
                now_result = self.execute(sign, my_strategy, my_strategy_kwgs, plot)
                if now_result is not None:
                    all_results[sign] = now_result
            except:
                print(sign)
                raise
            pbar.update(1)

            if self._exit_program:
                break
        
        if self._exit_program:
            pbar.set_description("interrupted")
        else:
            pbar.set_description("finished")
        time.sleep(1)
        pbar.close()

        # dump the result into a pickle file
        with open(f"test.pickle", "wb") as f:
            pickle.dump(all_results, f)

class TWSEData(bt.feeds.PandasData):
    lines = ('turnover',)
    params = (('turnover', "成交金額"),)

class TWSEBacktester(Backtester):
    def __init__(self, start_time, end_time):
        super().__init__(start_time, end_time)

        def GetRawData():
            mongo_url = "mongodb://localhost:27017"
            db_name = "trading-project"
            col_name = "stock-num"

            try:
                client = pymongo.MongoClient(mongo_url)
                db = client[db_name]
                col = db[col_name]
                print("...Successfully connected to Database\n")
            except:
                print("...Failed to connect to Database\n")
                raise

            raw_data = list(col.find())
            raw_data_revised = {data["_id"]: data for data in raw_data}

            return raw_data_revised

        self._raw_data = GetRawData()

        def GetPriceData():
            def ChangeDate(date_str):
                year, month, day = map(int, date_str.split("/"))
                return datetime(year + 1911, month, day)

            price_data = {}

            for stock_num in self._raw_data:
                redundant_signs = [",", "X", "-"]

                # if "成交金額" is "0", remove the data from the list
                prices = [data for data in self._raw_data[stock_num]["prices"].values() if data["開盤價"] != "--"]

                # if there is no data, skip
                if len(prices) == 0:
                    continue

                prices_df = pd.DataFrame.from_dict(prices)
                prices_df["日期"] = prices_df["日期"].map(ChangeDate)
                    
                # set index to datetime
                prices_df.set_index("日期", inplace=True)
                prices_df.sort_index(inplace=True)

                # filter out the data that is not in the time range
                prices_df = prices_df.loc[self.start_time:self.end_time]

                # remove all redundant signs from every number
                for col in prices_df.columns:
                    for sign in redundant_signs:
                        prices_df[col] = prices_df[col].str.replace(sign, '')

                # convert all numbers to float
                prices_df = prices_df.astype(float)

                # delete rows with same index
                prices_df = prices_df[~prices_df.index.duplicated(keep='first')]

                price_data[stock_num] = prices_df

            return price_data

        self._data_kwargs = {
            "open": "開盤價",
            "high": "最高價",
            "low": "最低價",
            "close": "收盤價",
            "volume": "成交股數",
            "turnover": "成交金額"
        }

        self._set_price_data(GetPriceData(), TWSEData, self._data_kwargs)

        def get_weighed_stock():
            # read weighted_stock.csv as a dataframe and encoding as utf-8-sig
            weighted_stock = pd.read_csv("info//weighted_stock.csv", encoding="utf-8-sig")

            # set index to "證券代號"
            weighted_stock.set_index("證券代號", inplace=True)

            return weighted_stock

        self._weighted_stock = get_weighed_stock()

        def get_turnover_rank():
            # turnover is in the price_data
            turnover_rank = {}

            for stock_num in self._price_data:
                for date in self._price_data[stock_num].index:
                    if date not in turnover_rank:
                        turnover_rank[date] = []
                    now_turnover = self._price_data[stock_num].loc[date, "成交金額"]
                    try:
                        now_turnover = float(now_turnover)
                    except:
                        print(now_turnover, stock_num, date)
                        raise
                    turnover_rank[date].append((stock_num, now_turnover))
            
            # sort out the highest 30 turnover
            for date in turnover_rank:
                turnover_rank[date] = sorted(turnover_rank[date], key=lambda x: x[1], reverse=True)[:30]
                turnover_rank[date] = [stock_num for stock_num, _ in turnover_rank[date]]


            return turnover_rank

        self._turnover_rank = get_turnover_rank()

        # def test():
        #     _test = {}
        #     for value in self._turnover_rank.values():
        #         for stock_num in value:
        #             if stock_num not in _test:
        #                 _test[stock_num] = 0
        #             _test[stock_num] += 1

        #     # get top 30 
        #     _test = sorted(_test.items(), key=lambda x: x[1], reverse=True)[60:90]

        #     print(_test)

        # test()
    # convert database ids to stock_nums, methods, year, season, month, and day
    def ConvertId(self, *args):
        now_id = args[0]
        stock_num, method, year, season, month, day = now_id.split('-')

        # convert everything except method into int
        stock_num = int(stock_num)
        year = int(year)
        season = int(season)
        month = int(month)
        day = int(day)

        # return a dictionary with all the values
        return {"stock_num": stock_num, "method": method, "year": year, "season": season, "month": month, "day": day}


class CryptoBacktester(Backtester):
    def __init__(self, start_time, end_time):
        super().__init__(start_time, end_time)
        def GetRawData():
            # get all files from info/crypto_prices
            files = os.listdir("info/crypto_prices")
            filenames = [file.split(".")[0] for file in files]

            raw_data = {}
            for filename in filenames:
                # read csv file as a dataframe and encoding as utf-8-sig
                df = pd.read_csv(f"info/crypto_prices/{filename}.csv", encoding="utf-8-sig")
                # turn to timestamp
                df["timestamp"] = pd.to_datetime(df["timestamp"], format="ISO8601")
                # set index to "timestamp"
                df.set_index("timestamp", inplace=True)
                # sort index
                df.sort_index(inplace=True)
                # delete rows with timestamp not in the time range
                df = df.loc[self.start_time:self.end_time]

                raw_data[filename] = df
            
            return raw_data
        
        self._crypto_df = GetRawData()

        # print(self._crypto_df["BTC"])
        self._data_kwargs = {
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
        }
        self._set_price_data(self._crypto_df, bt.feeds.PandasData, self._data_kwargs)


def main():
    # test = CryptoBacktester("2020-01-15", "2021-06-01")
    # result = test.execute("BNB", FibonRetraceStrategy, plot=True)

    test = TWSEBacktester("2020-01-01", "2022-12-31")
    result = test.execute("2330", CrossoverStrategy, plot=True)

    
    print(result["return"], result["buy_and_hold return"])
    # print(test.turnover_rank)

    # test.execute_all(BullishAlignmentStrategy)
    # test.execute_all(CrossoverStrategy)
    # test.execute_all(BbandMaStrategy)

if __name__ == '__main__':
    main()
