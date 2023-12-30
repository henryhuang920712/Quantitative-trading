from abc import ABC, abstractmethod
from selenium.webdriver.support.ui import Select
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException, TimeoutException, StaleElementReferenceException

from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from tqdm.auto import tqdm
import pandas as pd
import exchange_calendars as xcals
import os
import threading
import multiprocessing
import time
import pymongo
from pymongo.server_api import ServerApi
from pymongo.errors import OperationFailure
import keyboard
import random
import pickle
import logging
import sys
import certifi
import socket
import json
import datetime
import ccxt
from ccxt.base.errors import InvalidNonce, BadSymbol


class Scraper:
    def __init__(self, start_time, end_time, headless=False, timer=0):
        # if the format of date not correct, then exit the program
        try:
            datetime.datetime.strptime(start_time, "%Y-%m-%d")
            datetime.datetime.strptime(end_time, "%Y-%m-%d")
        except ValueError:
            print("...Invalid date format\n")
            sys.exit()
        self.start_time = start_time
        self.end_time = end_time

        self._max_thread = 5
        self._max_process = 10
        self._page_load_timeout = 20
        self._element_timeout = 40

        self._timer = timer

        # set the logging level of selenium to ERROR
        logging.getLogger("selenium").setLevel(logging.ERROR)

        def GenerateOptions(headless):
            options = webdriver.ChromeOptions()
            options.add_experimental_option(
                'excludeSwitches', ['enable-logging'])
            prefs = {
                'profile.default_content_setting_values':
                    {
                        'notifications': 2,
                        'automatic_downloads': 1
                    }
            }
            options.add_experimental_option("prefs", prefs)
            options.add_extension(
                f"extensions\\gjknjjomckknofjidppipffbpoekiipm\\7.0.19_0.crx")
            options.add_argument('--no-sandbox')
            # options.page_load_strategy = 'eager'

            if headless:
                options.add_argument('--headless=new')
                options.add_argument('--disable-gpu')
            return options

        self.options = GenerateOptions(headless)
        self._exit_program = False

    def _set_exit_program(self):
        self._exit_program = True

    def SetDriver(self):

        try:
            # service = ChromeService(ChromeDriverManager().install())
            driver = webdriver.Chrome(options=self.options)

            # set page load
            driver.set_page_load_timeout(self._page_load_timeout)

            # minimize the window
            driver.minimize_window()

            driver.get(
                "chrome-extension://gjknjjomckknofjidppipffbpoekiipm/panel/index.html")

            target_button = WebDriverWait(driver, self._element_timeout).until(
                EC.element_to_be_clickable(
                    (By.XPATH, '//*[@id="screenMain"]/div[3]/div[1]'))
            )
            target_button.click()

            time.sleep(random.uniform(0.5, 3))
        except:
            # check for internet connection
            if not self._network_connected():
                print("...No internet connection\n")

                # if there is no internet connection, stop the program
                self._set_exit_program()
            else:
                self._set_exit_program()
                raise
                # try:
                #     driver.quit()
                # except UnboundLocalError:
                #     pass

                # return self.SetDriver()

        return driver

class TWSEScraper(Scraper):

    # start_time and end_time are str like 2020-01-01
    # the timer value should be in minutes
    def __init__(self, start_time, end_time, headless=False, timer=0) -> None:
        super().__init__(start_time, end_time, headless, timer)

        # get the download directory
        self.download_dir = os.path.join(
            os.path.expanduser("~"), "Downloads") + "\\"
        
        # self.mongo_url = "mongodb+srv://hamburgerhenry13:mondrole20116@web-app.mjvkbro.mongodb.net/?retryWrites=true&w=majority"
        # read the mongo_url from json file
        with open("config.json", "r") as f:
            config = json.load(f)
            self.mongo_url = config["DB_URL"]
            self.db_name = config["DB_NAME"]

        self.__method_ref = {self.GetMonthlyPrices: "prices", self.GetBasicInfo: "basic_info",
                             self.GetBalanceSheet: "balance_sheet", self.GetIncomeStatement: "income_statement",
                             self.GetSales: "sales", self.GetTradingInfo: "trading_info",
                             self.GetMarketMaker: "market_maker"}
        self.__month_to_season = {
            1: 1, 2: 1, 3: 1, 4: 2, 5: 2,
            6: 2, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4
        }
        self.__season_to_month = {
            1: 1, 2: 4, 3: 7, 4: 10
        }



        def GetOldData():
            myclient = self.__connect_to_mongo()

            mydb = myclient[self.db_name]
            stock_num_col = mydb["stock-num"]

            no_data_col = mydb["no-data"]
            # get all data from "stock_num"
            all_data = list(stock_num_col.find())
            no_data = list(no_data_col.find())

            # close the connection
            myclient.close()

            # convert the list of data into a dictionary with _id as key and the rest as value
            all_data_revised = {data["_id"]: data for data in all_data}
            no_data_revised = {data["_id"]: data["data"] for data in no_data}

            return all_data_revised, no_data_revised

        self.old_data, self.no_data = GetOldData()

        self.__stock_num_list = list(self.old_data.keys())

        def GetTimeIntervals():
            # get date ranges from pd, then turn them into list
            time_intervals = {}
            time_intervals['month'] = pd.date_range(
                start=self.start_time, end=self.end_time, freq="MS").to_list()
            time_intervals['season'] = pd.date_range(
                start=self.start_time, end=self.end_time, freq="QS").to_list()
            time_intervals['year'] = pd.date_range(
                start=self.start_time, end=self.end_time, freq="YS").to_list()

            # get the day intervals with the help of exchange_calendars
            twse_cal = xcals.get_calendar("XTAI")
            time_intervals["day"] = twse_cal.schedule.loc[self.start_time:self.end_time].index.to_list(
            )

            # convert the dates into dictionaries
            for key, value in time_intervals.items():
                time_intervals[key] = [{"year": date.year - 1911, "season": self.__month_to_season[date.month],
                                        "month": date.month, "day": date.day} for date in value]

            ref = {interval['month']: []
                   for interval in time_intervals["month"]}
            for date in time_intervals["day"]:
                ref[date["month"]].append(date)

            return time_intervals, ref

        self.time_intervals, self.__date_ref = GetTimeIntervals()

        def GetMarketMakerInfo():
            # load market_maker_info.csv with all values as string
            market_maker_info = pd.read_csv(
                "info//market_maker_info.csv", dtype=str)

            # turn the data into a dictionary with columns as keys
            market_maker_info = market_maker_info.to_dict(orient="list")

            # delete all nan in lists in the dictionary
            for key, value in market_maker_info.items():
                market_maker_info[key] = [
                    data for data in value if str(data) != "nan"]

            return market_maker_info
        self.__market_maker_info = GetMarketMakerInfo()

    def _network_connected(self):
        hostname = "one.one.one.one"  # Cloudflare's DNS server
        try:
            # See if we can resolve the host name - tells us if there is
            # A DNS listening
            host = socket.gethostbyname(hostname)
            # Connect to the host - tells us if the host is actually reachable
            s = socket.create_connection((host, 80), 2)
            s.close()
            return True
        except Exception:
            pass  # We ignore any errors, returning False
        return False

    def __connect_to_mongo(self):
        # the old data from the database
        try:
            myclient = pymongo.MongoClient(self.mongo_url)
            # myclient = pymongo.MongoClient(self.mongo_url, server_api=ServerApi('1'), tlsCAFile=certifi.where())
            print("...Successfully connected to the database\n")
            return myclient
        except:
            if not self._network_connected():
                print("...No internet connection\n")
            else:
                # if the connection fails, print out the error and exit the program
                print("...Failed to connect to the database\n")

            sys.exit()

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

    # generate id from stock_num, method, year, season, month, and day
    def GenerateId(self, **kwargs):
        # if there's no season, month, or day, then set them to 1
        # elif there's no season but there's month, then set season to corresponding season

        for key in kwargs:
            try:
                kwargs[key] = int(kwargs[key])
            except:
                pass

        if "season" not in kwargs:
            if "month" not in kwargs:
                kwargs["season"] = 1
                kwargs["month"] = 1
            else:
                kwargs["season"] = self.__month_to_season[kwargs["month"]]
        else:
            if "month" not in kwargs:
                kwargs["month"] = self.__season_to_month[kwargs["season"]]
            else:
                pass

        stock_num = kwargs.get("stock_num", 1101)
        method = kwargs["method"]
        year = kwargs["year"]
        season = kwargs["season"]
        month = kwargs["month"]
        day = kwargs.get("day", 1)

        return f"{stock_num}-{method}-{year}-{season}-{month}-{day}"

    def GetStockNum(self, mode="stock"):
        driver = self.SetDriver()

        num_ref = {}
        ref_keys = []

        driver.get(
            f"https://isin.twse.com.tw/isin/C_public.jsp?strMode=2")

        # get the tbody
        tbody = driver.find_element(By.CSS_SELECTOR, "tbody")

        # get every tr in the tbody
        trs = tbody.find_elements(By.CSS_SELECTOR, "tr")

        # get the leading row
        leading_row = trs[0]
        leading_row_ths = leading_row.find_elements(By.CSS_SELECTOR, "td")
        # for loop
        for tr in trs[1:]:
            # get the first td in the tr
            tds = tr.find_elements(By.CSS_SELECTOR, "td")
            if len(tds) == 1:  # there is a new category

                if len(ref_keys) > 0:
                    df = num_ref[ref_keys[-1]]
                    # split the stockname and stocknum
                    df[["代號", "名稱"]] = df['有價證券代號及名稱'].str.split(expand=True)

                    # drop the original column
                    df.drop(columns=["有價證券代號及名稱"], inplace=True)

                    # move the num column to the first and name to second
                    cols = df.columns.tolist()
                    cols = cols[-2:] + cols[:-2]
                    df = df[cols]

                    # set num into index
                    df.set_index("代號", inplace=True)
                    num_ref[ref_keys[-1]] = df

                    if mode == "stock":
                        return num_ref

                # store the new category into the dictionary
                ref_keys.append(tds[0].text)
                num_ref[ref_keys[-1]] = pd.DataFrame(
                    columns=[th.text.replace("\n", "") for th in leading_row_ths])
            else:
                df = num_ref[ref_keys[-1]]
                df = pd.concat([df, pd.DataFrame(
                    [[td.text for td in tds]], columns=df.columns)], ignore_index=True)
                num_ref[ref_keys[-1]] = df

        # Close the driver
        driver.quit()

        return num_ref

    def GetWeightedStock(self):
        # get the list of weighted stock
        driver = self.SetDriver()

        driver.get("https://www.taifex.com.tw/cht/9/futuresQADetail")

        # select the tbody in table with explicit_wait, and table is in div with id="printhere"
        tbody = WebDriverWait(driver, self._element_timeout).until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, "#printhere > div > table > tbody"))
        )

        # scrape the data with execute_script
        data = driver.execute_script("""
                let trs = arguments[0].querySelectorAll("tr");
                let dict_key = [];
                let now_dict = new Object();                     

                leading_ths = trs[0].querySelectorAll("th");
                for (let i = 0; i < leading_ths.length; i++) {
                    if (!dict_key.includes(leading_ths[i].innerText)) {
                        dict_key.push(leading_ths[i].innerText);
                    }
                }
                dict_key.splice(1, 0, "證券代號");
                    
                for (let i = 1; i < trs.length; i++) {
                    let tds = trs[i].querySelectorAll("td");
                    let texts = [];
                    for (let j = 0; j < tds.length; j++) {
                        texts.push(tds[j].innerText);
                    }
                
                    while (texts.length > 0) {
                        let now_data = new Object();
                        for (let k = 0; k < dict_key.length; k++) {
                            let now_text = texts.shift();
                            now_data[dict_key[k]] = now_text;
                        }
                        now_dict[now_data["證券代號"]] = now_data;
                        
                    }
                }
                return now_dict;            
            """, tbody)

        # Close the driver
        driver.quit()

        # convert the data into dataframe
        df = pd.DataFrame.from_dict(data, orient="index")

        # set "證券代號" as index
        df.set_index("證券代號", inplace=True)

        # store as file
        df.to_csv("weighted_stock.csv", encoding="utf-8-sig")

    # from twse website, get the monthly prices of the target stock

    def GetMonthlyPrices(self, **kwargs):
        # get the stock_num, year, and month
        stock_num = kwargs["stock_num"]
        year = kwargs["year"]
        month = kwargs["month"]
        method = kwargs["method"]

        no_data_kwargs = [date | {"stock_num": stock_num, "method": method}
                          for date in self.time_intervals["day"] if date["year"] == year and date["month"] == month]
        no_data_ref = [self.GenerateId(**k) for k in no_data_kwargs]

        # update data from no_data_ref into the no-data database
        def update_no_data():
            self.no_data[method][stock_num] += no_data_ref

        driver = self.SetDriver()

        try:

            # Navigate to the target URL
            driver.get(
                f"https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=html&date={year+1911}{month:02d}01&stockNo={stock_num}")

            # if find no data, then return
            message_log = driver.find_element(By.CSS_SELECTOR, "body > div")

            if "很抱歉，沒有符合條件的資料!" in message_log.text:
                driver.quit()

                # update the no data into the no-data database
                update_no_data()

                return
            elif "查詢日期小於99年1月4日，請重新查詢!" in message_log.text or \
                    "查詢日期大於今日，請重新查詢!" in message_log.text:
                driver.refresh()

            # get the table with explicit wait
            table = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "table")))
            # leading row
            leading_row = table.find_element(
                By.CSS_SELECTOR, "thead > tr:nth-child(2)")
            leading_row_ths = leading_row.find_elements(By.CSS_SELECTOR, "th")

            # store leading rows as dict keys
            dict_keys = [th.text for th in leading_row_ths]

            # get all td from the table in this webpage
            tbody = driver.find_element(By.CSS_SELECTOR, "tbody")
            trs = tbody.find_elements(By.CSS_SELECTOR, "tr")

            # get every rows, and update the corresponding data obj in list of data
            for tr in trs:
                tds = tr.find_elements(By.CSS_SELECTOR, "td")

                dict_values = [td.text for td in tds]

                # convert xxx/xx/xx to stock_num-method-year-season-month-day
                day = dict_values[0].split('/')[2]
                _kwargs = {
                    "stock_num": stock_num,
                    "method": "prices",
                    "year": year,
                    "month": month,
                    "day": day
                }
                # generate the key
                key = self.GenerateId(**_kwargs)

                # store the data into mongodb
                # self.__stock_num_col.update_one({"_id": stock_num}, {"$set": {f"prices.{key}": dict(zip(dict_keys, dict_values))}})

                # store the data into self.old_data
                self.old_data[stock_num]["prices"][key] = dict(
                    zip(dict_keys, dict_values))

                # some dates are after the end_time, causing them not being in no_data_ref
                # so we could just pass the error and continue
                try:
                    # remove the date from no_data_ref
                    no_data_ref.remove(key)
                except ValueError:
                    pass

            # Close the driver
            driver.quit()

            # update the no data into the no-data database
            update_no_data()

            return
        except TimeoutException:
            driver.quit()

            # execute the function again
            self.GetMonthlyPrices(**kwargs)

    # from mops, get basic info of the target stock
    def GetBasicInfo(self, **kwargs):
        # get the target stock num
        target_stock_num = kwargs["stock_num"]

        driver = self.SetDriver()

        output_dict = {}

        driver.get(f"https://mops.twse.com.tw/mops/web/t05st03")

        # locate the input with explicit wait
        stock_input = WebDriverWait(driver, self._element_timeout).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "#co_id"))
        )

        stock_input.send_keys(target_stock_num)

        search_button = driver.find_element(
            By.CSS_SELECTOR, "input[value=' 查詢 ']")
        search_button.click()

        # get all td from the table in this webpage with explicit wait
        tbody = WebDriverWait(driver, self._element_timeout, ignored_exceptions=(TimeoutException)).until(
            EC.visibility_of_element_located(
                (By.CSS_SELECTOR, 'div[id="table01"] > table:nth-of-type(2) > tbody'))
        )
        trs = tbody.find_elements(By.CSS_SELECTOR, "tr")
        for tr in trs:
            children = tr.find_elements(By.CSS_SELECTOR, "th,td")
            th_to_td = {children[i-1].text: children[i].text for i in range(
                len(children) - 1) if children[i].tag_name == "td"}

            # concat the dictionary with the output_dict
            output_dict = output_dict | th_to_td

        # Close the driver
        driver.quit()

        # store the data into mongodb
        # self.__stock_num_col.update_one({"_id": target_stock_num}, {"$set": {"basic_info": output_dict}})

        # store the data into self.old_data
        self.old_data[target_stock_num]["basic_info"] = output_dict

        return

    # from mops, get balance sheet or income statements of the target stock
    # this function could only be used in class
    def _GetFinStats(self, **kwargs):
        no_data_ref = self.__stock_num_list.copy()

        target_year = kwargs["year"]
        target_season = kwargs["season"]
        method = kwargs["method"]

        if method == "balance_sheet":
            target_url = "https://mops.twse.com.tw/mops/web/t163sb05"
        elif method == "income_statement":
            target_url = "https://mops.twse.com.tw/mops/web/t163sb04"

        driver = self.SetDriver()

        driver.get(target_url)

        # locate the input with explicit wait
        year_input = WebDriverWait(driver, self._element_timeout).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "#year"))
        )
        year_input.send_keys(target_year)

        season_select = Select(
            driver.find_element(By.CSS_SELECTOR, "#season"))
        season_select.select_by_value(f"0{str(target_season)}")

        search_button = driver.find_element(
            By.CSS_SELECTOR, "#search_bar1 input[type='button']")
        search_button.click()

        tbodies = WebDriverWait(driver, self._element_timeout).until(
            EC.visibility_of_all_elements_located(
                (By.CSS_SELECTOR, "#table01 tbody"))
        )[1:]  # ignore first table

        for tbody in tbodies:

            # get all trs in the tbody with execute script
            now_dict = driver.execute_script("""
                let trs = arguments[0].querySelectorAll("tr");
                let dict_key = [];
                let now_dict = new Object();
                
                leading_ths = trs[0].querySelectorAll("th");
                for (let i = 0; i < leading_ths.length; i++) {
                    dict_key.push(leading_ths[i].innerText);
                }   
                    
                for (let i = 1; i < trs.length; i++) {
                    let tds = trs[i].querySelectorAll("td");
                    let stock_num = tds[0].innerText;
                    now_dict[stock_num] = new Object();
                    for (let j = 0; j < tds.length; j++) {
                        now_dict[stock_num][dict_key[j]] = tds[j].innerText;
                    }
                }
                return now_dict;
            """, tbody)

            for stock_num in now_dict:
                kwargs["stock_num"] = stock_num
                key = self.GenerateId(**kwargs)

                # store the data into mongodb
                # self.__stock_num_col.update_one({"_id": stock_num}, {"$set": {f"{mode}.{key}": now_dict[stock_num]}})

                # store the data into self.old_data
                try:
                    data_revised = {key.replace(
                        '\n', ""): value for key, value in now_dict[stock_num].items()}
                    self.old_data[stock_num][method][key] = data_revised

                    # remove the stock_num from no_data_ref
                    no_data_ref.remove(stock_num)
                except KeyError:
                    pass

        # Close the driver
        driver.quit()

        # update the stock with no data into self.__no_data_col
        for stock_num in no_data_ref:
            kwargs["stock_num"] = stock_num
            self.no_data[method][stock_num].append(self.GenerateId(**kwargs))

        return

    def GetBalanceSheet(self, **kwargs):

        self._GetFinStats(**kwargs)

    def GetIncomeStatement(self, **kwargs):

        self._GetFinStats(**kwargs)

    def GetSales(self, **kwargs):
        no_data_ref = self.__stock_num_list.copy()

        # get the target year and month
        target_year = kwargs["year"]
        target_month = kwargs["month"]
        method = kwargs["method"]

        driver = self.SetDriver()
        driver.get(
            f"https://mops.twse.com.tw/nas/t21/sii/t21sc03_{target_year}_{target_month}_0.html")

        # download csv
        download_button = WebDriverWait(driver, self._element_timeout).until(
            EC.visibility_of_element_located(
                (By.CSS_SELECTOR, "input[value='另存CSV']"))
        )
        download_button.click()

        file = f"t21sc03_{target_year}_{target_month}.csv"

        # if file is already in the directory, read csv as dataframe, else wait for the file to download
        while file not in os.listdir(self.download_dir):
            time.sleep(1)

        df = pd.read_csv(self.download_dir + file, encoding="utf-8")

        # change the column 公司代號 to string
        df["公司代號"] = df["公司代號"].astype(str)

        df = df.set_index("公司代號")

        # set the index to be the stock number and turn it into dict with key as stock number
        now_dict = df.to_dict(orient="index")

        # Close the driver
        driver.quit()

        # remove the csv file
        os.remove(self.download_dir + file)

        # store the data into self.new_data
        for stock_num in now_dict:
            kwargs["stock_num"] = stock_num
            key = self.GenerateId(**kwargs)

            # store the data into mongodb
            # self.__stock_num_col.update_one({"_id": stock_num}, {"$set": {f"sales.{key}": now_dict[stock_num]}})

            try:
                self.old_data[stock_num]["sales"][key] = now_dict[stock_num]

                # remove the stock_num from no_data_ref
                no_data_ref.remove(stock_num)
            except KeyError:
                pass

        # update the stock with no data into self.no_data
        for stock_num in no_data_ref:
            kwargs["stock_num"] = stock_num
            self.no_data[method][stock_num].append(self.GenerateId(**kwargs))

        return

    def GetTradingInfo(self, **kwargs):
        no_data_ref = self.__stock_num_list.copy()

        target_year = kwargs["year"]
        target_month = kwargs["month"]
        target_day = kwargs["day"]
        method = kwargs["method"]

        driver = self.SetDriver()

        driver.get(
            f"https://www.twse.com.tw/fund/T86?response=html&date={target_year+1911}{target_month:02d}{target_day:02d}&selectType=ALLBUT0999")

        # get the table with explicit wait
        table = WebDriverWait(driver, self._element_timeout).until(
            EC.visibility_of_element_located(
                (By.CSS_SELECTOR, "table")))

        # get all data using execute script
        data = driver.execute_script("""
            let dict_keys = [];
            let ths = arguments[0].querySelectorAll("table > thead > tr:nth-child(2) > th");
            for (let i = 0; i < ths.length; i++) {
                dict_keys.push(ths[i].innerText);
            }
                                     
            let data = new Object();
            let trs = arguments[0].querySelectorAll("table > tbody > tr");
            for (let i = 0; i < trs.length; i++) {
                let tds = trs[i].querySelectorAll("td");
                let stock_num = tds[0].innerText;
                data[stock_num] = new Object();
                for (let j = 0; j < tds.length; j++) {
                    data[stock_num][dict_keys[j]] = tds[j].innerText;
                }
            }
            return data;
            """, table)

        # Close the driver
        driver.quit()

        # store the data into self.new_data
        for stock_num in data:
            kwargs["stock_num"] = stock_num
            key = self.GenerateId(**kwargs)

            # store the data into mongodb
            # self.__stock_num_col.update_one({"_id": stock_num}, {"$set": {"trading_info.{key}": info_rows[stock_num]}})

            try:
                data_revised = {key.replace(
                    '\n', ""): value for key, value in data[stock_num].items()}
                # store the data into self.old_data
                self.old_data[stock_num]["trading_info"][key] = data_revised

                # remove the stock_num from no_data_ref
                no_data_ref.remove(stock_num)
            except KeyError:
                pass

        # update the stock with no data into self.no_data
        for stock_num in no_data_ref:
            kwargs["stock_num"] = stock_num
            self.no_data[method][stock_num].append(self.GenerateId(**kwargs))

        return

    def GetMarketMaker(self, **kwargs):

        target_stock_num = kwargs["stock_num"]
        method = kwargs["method"]

        driver = self.SetDriver()

        all_data = {}

        for sf in self.__market_maker_info:
            for bb in self.__market_maker_info[sf]:
                # if exit program, return
                if self._exit_program:
                    return

                try:
                    # get to target url
                    driver.get(
                        f"https://fubon-ebrokerdj.fbs.com.tw/z/zc/zco/zco0/zco0.djhtm?A={target_stock_num}&BHID={sf}&b={bb}&C=1&D={self.start_time}&E={self.end_time}&ver=V3")
                except TimeoutException:

                    driver.refresh()

                # get the div with id="SysJustIFRAMEDIV" with explicit wait
                div = WebDriverWait(driver, self._element_timeout).until(
                    EC.visibility_of_element_located(
                        (By.CSS_SELECTOR, "div#SysJustIFRAMEDIV")))

                # get the table
                try:
                    table = div.find_element(
                        By.CSS_SELECTOR, "table#oMainTable")
                except NoSuchElementException:
                    continue

                # execute script
                data = driver.execute_script("""
                        let data = new Object();                                                                            
                        let dict_keys = [];
                        let trs = arguments[0].querySelectorAll("tbody > tr");              
                        let ths = trs[0].querySelectorAll("td");
                        for (let i = 0; i < ths.length; i++) {
                            dict_keys.push(ths[i].innerText);
                        }
                        for (let i = 1; i < trs.length; i++) {
                            let tds = trs[i].querySelectorAll("td");
                            let date = tds[0].innerText;
                            data[date] = new Object();
                            for (let j = 1; j < tds.length; j++) {
                                data[date][dict_keys[j]] = tds[j].innerText;
                            }
                        }
                        return data;
                    """, table)

                if data is None:
                    continue

                for date in data:
                    year, month, day = date.split("/")
                    _kwargs = {
                        "stock_num": target_stock_num,
                        "method": method,
                        "year": year,
                        "month": month,
                        "day": day
                    }
                    key = self.GenerateId(**_kwargs)
                    if key not in all_data:
                        all_data[key] = {}
                    if sf not in all_data[key]:
                        all_data[key][sf] = {}
                    all_data[key][sf][bb] = data[date]

        # Close the driver
        driver.quit()

        # store the data into self.old_data with deep copy
        self.old_data[target_stock_num]["market_maker"] = all_data

        return

    def UpdateStockNum(self):  # update the stock number list in database

        # get the old data
        old_data = list(self.__stock_num_col.find())

        # get the new data
        new_data = self.GetStockNum()["股票"]

        # get the old stock number
        old_stock_num = [data["_id"] for data in old_data]

        # get the new stock number
        new_stock_num = list(new_data.index)

        # get the stock number that is not in the database
        new_stock_num = [
            stock_num for stock_num in new_stock_num if stock_num not in old_stock_num]

        # append the all data of new stock into the database
        for stock_num in new_stock_num:
            now_dict = new_data.loc[stock_num].to_dict()
            now_dict["_id"] = stock_num
            self.__stock_num_col.insert_one(now_dict)

    def CheckForUpdates(self):

        ref = {key: [] for key in self.__method_ref}
        for stock_num in self.old_data:
            method = "prices"
            for month in self.__date_ref:
                for date in self.__date_ref[month]:
                    kwargs = date | {"stock_num": stock_num, "method": method}

                    now_key = self.GenerateId(**kwargs)

                    if now_key not in self.old_data[stock_num][method] and now_key not in self.no_data[method][stock_num]:
                        ref[self.GetMonthlyPrices].append(kwargs)
                        break

        for stock_num in self.old_data:
            method = "basic_info"
            kwargs = {"stock_num": stock_num}
            if len(self.old_data[stock_num][method]) > 0:
                continue
            ref[self.GetBasicInfo].append(kwargs)

        for interval in self.time_intervals["season"]:
            method = "balance_sheet"

            for stock_num in self.old_data:
                kwargs = interval | {"stock_num": stock_num, "method": method}
                now_key = self.GenerateId(**kwargs)

                if now_key not in self.no_data[method][stock_num] and now_key not in self.old_data[stock_num][method]:
                    ref[self.GetBalanceSheet].append(kwargs)
                    break

        for interval in self.time_intervals["season"]:
            method = "income_statement"

            for stock_num in self.old_data:
                kwargs = interval | {"stock_num": stock_num, "method": method}
                now_key = self.GenerateId(**kwargs)

                if now_key not in self.no_data[method][stock_num] and now_key not in self.old_data[stock_num][method]:
                    ref[self.GetIncomeStatement].append(kwargs)
                    break

        for interval in self.time_intervals["month"]:
            method = "sales"

            for stock_num in self.old_data:
                kwargs = interval | {"stock_num": stock_num, "method": method}
                now_key = self.GenerateId(**kwargs)
                if now_key not in self.no_data[method][stock_num] and now_key not in self.old_data[stock_num][method]:
                    ref[self.GetSales].append(kwargs)
                    break

        for interval in self.time_intervals["day"]:
            method = "trading_info"

            for stock_num in self.old_data:
                kwargs = interval | {"stock_num": stock_num, "method": method}
                now_key = self.GenerateId(**kwargs)
                if now_key not in self.no_data[method][stock_num] and now_key not in self.old_data[stock_num][method]:
                    ref[self.GetTradingInfo].append(kwargs)
                    break

        for stock_num in self.old_data:
            method = "market_maker"
            kwargs = {"stock_num": stock_num, "method": method}
            if len(self.old_data[stock_num][method]) > 0:
                continue
            ref[self.GetMarketMaker].append(kwargs)

        return ref

    # scrape all the data and store it in database
    def execute(self, mode):
        if self._timer > 0:
            timer = threading.Timer(self._timer * 60, self._set_exit_program)
            timer.start()
        else:
            timer = None

        # store the updated self.old_data into mongodb
        def UpdateOldData():
            # connect to mongodb
            myclient = self.__connect_to_mongo()
            mydb = myclient[self.db_name]
            #  if there's no collection, create one
            stock_num_col = mydb["stock-num"]
            no_data_col = mydb["no-data"]

            # delete the old data in collection and add the new data
            stock_num_col.delete_many({})
            try:
                stock_num_col.insert_many(list(self.old_data.values()))
            except:
                # if there's an error, store the file into local
                with open("stock_num.json", "w", encoding="utf-8") as f:
                    json.dump(self.old_data, f, ensure_ascii=False, indent=4)

            # delete the old data in collection and add the new data
            no_data_col.delete_many({})

            no_data = [{"_id": key, "data": self.no_data[key]}
                       for key in self.no_data]
            try:
                no_data_col.insert_many(no_data)
            except:

                # if there's an error, store the file into local
                with open("no_data.json", "w", encoding="utf-8") as f:
                    json.dump(no_data, f, ensure_ascii=False, indent=4)
            # close the connection
            myclient.close()

            print("\n...Successfully updated the database\n")

        try:
            keyboard.add_hotkey("esc", self._set_exit_program)

            updates = self.CheckForUpdates()
            # for key in updates:
            #     print(f"{key}: {len(updates[key])}")
            procedures = sum(len(updates[key]) for key in updates)

            tqdm.write("--- press ESC to exit the program ---\n")
            pbar = tqdm(total=procedures, desc="scraping process",
                        colour="red", position=0, leave=True)

            if mode == "multi-threading":
                for key in updates:
                    threads = []
                    pbar.set_postfix({"now-scraping": self.__method_ref[key]})
                    for _kwarg in updates[key]:
                        threads.append(threading.Thread(
                            target=key, kwargs=_kwarg))
                    # start and join all threads
                    while len(threads) > 0:
                        if self._exit_program:
                            break
                        max_thread = self._max_thread if len(
                            threads) > self._max_thread else len(threads)
                        # start every 5 thread at a time, and wait for them to finish
                        # after finishing, remove them

                        for i in range(max_thread):
                            threads[i].start()
                        for i in range(max_thread):
                            threads[i].join()
                            pbar.update(1)

                        pbar.refresh()
                        threads = threads[max_thread:]
            elif mode == "single-threading":
                for key in updates:
                    for _kwarg in updates[key]:
                        if self._exit_program:
                            break
                        pbar.set_postfix(
                            {"now-scraping": self.__method_ref[key]})
                        pbar.refresh()
                        key(**_kwarg)

                        # time.sleep(1)
                        pbar.update(1)
            elif mode == "multi-processing":

                for key in updates:
                    # multiprocessing
                    pool = multiprocessing.Pool(processes=3)
                    results = []
                    for _kwarg in updates[key]:
                        results.append(pool.apply_async(key, kwds=_kwarg))

                    pbar.set_postfix({"now-scraping": self.__method_ref[key]})
                    pbar.refresh()
                    for result in results:
                        if self._exit_program:
                            break
                        try:
                            result.get()
                        except Exception as e:
                            # print out the error message
                            print(e)

                        pbar.update(1)

                    pool.close()
                    pool.join()

        except:
            self._set_exit_program()
            raise
        finally:
            if self._exit_program:  # interrupting scraping
                pbar.set_description("scraping interrupted")

            else:  # finish scraping
                pbar.set_description("scraping completed")

            time.sleep(3)
            pbar.close()

            # quit keyboard
            keyboard.unhook_all()

            if timer is not None:
                timer.cancel()
            # update the old data
            UpdateOldData()


class CryptoScraper(Scraper):
    def __init__(self, start_time, end_time, headless=False, timer=0):
        super().__init__(start_time, end_time, headless, timer)

        self.__api_key = "oSivpYjlZ2cN9q8N8oL61LyEZ1xKuMmNiHo9quCTv4QzJnxchmKA9E9J9DYqoc7P"
        self.__secret = "3KZLDBMfN0cUGzWt2C3NEZdYldCJX2m8eMEMCdLKRXGk8vKlyDhpknKeuieWjR8C"
        self.__timeframe = "1h"

        self.__method_ref = {
            self.GetPriceData: "crypto prices"
        }

        def GetOldData():
            old_data = {}
            # read all files in info\crypto_prices\
            files = os.listdir("info//crypto_prices//")

            # get all the filenames
            filenames = [file.split(".")[0] for file in files]

            for filename in filenames:
                # read the csv file
                df = pd.read_csv(
                    f"info//crypto_prices//{filename}.csv", index_col=0)
                
                # convert the index into timestamp
                df.index = pd.to_datetime(df.index, format="ISO8601")

                # store the dataframe into old_data
                old_data[filename] = df
            
            return old_data
        
        self.__old_data = GetOldData()

        def GetRawData():
            crypto_list = pd.read_csv("info//crypto_list.csv", encoding="utf-8-sig")

            # delete the row with "USD" in the column "symbol"
            for i in range(len(crypto_list)):
                if 'USD' in crypto_list.loc[i, 'Symbol']:
                    crypto_list = crypto_list.drop(i)

            return crypto_list
        
        self.__crypto_df = GetRawData()

        # test = self.__old_data["BTC"].index[-1]
        # print(test)
    

    def GetCryptoList(self):
        # set the driver
        driver = self.SetDriver()

        driver.get("https://www.coingecko.com/en/all-cryptocurrencies")

        # get the button with explicit wait
        button = WebDriverWait(driver, self._element_timeout).until(
            EC.element_to_be_clickable(
                (By.CSS_SELECTOR, "#gecko-table-all + div > a"))
        )
        driver.execute_script("arguments[0].click();", button)

        time.sleep(5)

        # get the table with explicit wait
        table = WebDriverWait(driver, self._element_timeout).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "#gecko-table-all")))

        leading_ths = table.find_elements(
            By.CSS_SELECTOR, "thead > tr:nth-child(1) > th")

        data = {}
        # get all text from leading_ths
        dict_keys = [th.text for th in leading_ths]

        # get all trs in the table
        trs = table.find_elements(By.CSS_SELECTOR, "tbody > tr")

        for tr in trs:
            tds = tr.find_elements(By.CSS_SELECTOR, "td")
            dict_values = [td.text for td in tds]
            symbol = dict_values[1]
            data[symbol] = dict(zip(dict_keys, dict_values))

        # Close the driver
        driver.quit()

        # convert the data into dataframe
        df = pd.DataFrame.from_dict(data, orient="index")

        # set "Symbol" as index
        df.set_index("Symbol", inplace=True)

        # store as file
        df.to_csv("info/crypto_list.csv", encoding="utf-8-sig")

    def GetPriceData(self, crypto_symbol):
        # get historical data 2020-01-01 to 2021-01-01
        # tqdm.write(f"...now scraping {crypto_symbol}")
        

        # if data already in old data, only scrape the data after the last date
        if crypto_symbol in self.__old_data and len(self.__old_data[crypto_symbol]) > 0:
            try:
                start_time = self.__old_data[crypto_symbol].index[-1].strftime( "%Y-%m-%d")
            except AttributeError:
                tqdm.write(start_time)
                start_time = self.start_time
        else:
            start_time = self.start_time

        exchange = ccxt.binance({
            'apiKey': self.__api_key,
            'secret': self.__secret,
            'enableRateLimit': True,
        })

        # Specify the symbol, timeframe, and start date
        symbol = f'{crypto_symbol}/USDT'

        # Convert the start date to a timestamp
        from_timestamp = int(datetime.datetime.strptime(start_time, "%Y-%m-%d").timestamp() * 1000)
        to_timestamp = int(datetime.datetime.strptime(self.end_time, "%Y-%m-%d").timestamp() * 1000)
        
        df = pd.DataFrame(columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])

        try:
            while from_timestamp < to_timestamp:
                # Fetch the OHLCV data
                ohlcv = exchange.fetch_ohlcv(
                    symbol, self.__timeframe, from_timestamp, limit=1000)

                # Convert the data to a DataFrame
                now_df = pd.DataFrame(
                    ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])

                # Format the timestamp column
                now_df['timestamp'] = now_df['timestamp'].apply(exchange.iso8601)

                # concat the data
                df = pd.concat([df, now_df], axis=0)

                # if the length of the data is less than 1000, break the loop
                if len(ohlcv) < 1000:
                    break

                # Update the from_timestamp
                from_timestamp = ohlcv[-1][0] + 1

                if self._exit_program:
                    return

            # Set the timestamp column as the DataFrame's index
            df = df.set_index('timestamp')

            # delete the rows with time before start time and after end time
            df = df.loc[self.start_time:self.end_time]

            # update into self.__old_data
            if crypto_symbol in self.__old_data:
                self.__old_data[crypto_symbol] = pd.concat([self.__old_data[crypto_symbol], df])
            else:
                self.__old_data[crypto_symbol] = df

            return
        except InvalidNonce:
            tqdm.write(
                "Sync the time now in settings/ time and language/ sync now and try again")
            sys.exit()
        except BadSymbol:
            tqdm.write(f"{crypto_symbol} is not supported")

            # drop the row with the bad symbol
            self.__crypto_df = self.__crypto_df.drop(
                self.__crypto_df[self.__crypto_df['Symbol'] == crypto_symbol].index)

            return
        
    def CheckForUpdates(self):
            
            ref = {key: [] for key in self.__method_ref}
            for crypto_symbol in self.__crypto_df['Symbol']:
                method = "crypto prices"
                kwargs = {"crypto_symbol": crypto_symbol}
                ref[self.GetPriceData].append(kwargs)
    
            return ref

    def execute(self, mode):
        if self._timer > 0:
            timer = threading.Timer(self._timer * 60, self._set_exit_program)
            timer.start()
        else:
            timer = None
        keyboard.add_hotkey("esc", self._set_exit_program)

        def UpdateOldData():
            # store them into csv files in info\crypto_prices\
            for crypto_symbol in self.__old_data:
                self.__old_data[crypto_symbol].to_csv(
                    f"info//crypto_prices//{crypto_symbol}.csv", encoding="utf-8-sig")
            
        try:
            updates = self.CheckForUpdates()
            # for key in updates:
            #     print(f"{key}: {len(updates[key])}")
            procedures = sum(len(updates[key]) for key in updates)

            tqdm.write("--- press ESC to exit the program ---\n")
            pbar = tqdm(total=procedures, desc="scraping process",
                        colour="yellow", position=0, leave=True)

            if mode == "multi-threading":
                for key in updates:
                    threads = []
                    pbar.set_postfix({"now-scraping": self.__method_ref[key]})
                    for _kwarg in updates[key]:
                        threads.append(threading.Thread(
                            target=key, kwargs=_kwarg))
                    # start and join all threads
                    while len(threads) > 0:
                        if self._exit_program:
                            break
                        max_thread = self._max_thread if len(
                            threads) > self._max_thread else len(threads)
                        # start every 5 thread at a time, and wait for them to finish
                        # after finishing, remove them

                        for i in range(max_thread):
                            threads[i].start()
                        for i in range(max_thread):
                            threads[i].join()
                            pbar.update(1)

                        pbar.refresh()
                        threads = threads[max_thread:]
            elif mode == "single-threading":
                for key in updates:
                    for _kwarg in updates[key]:
                        if self._exit_program:
                            break
                        pbar.set_postfix(
                            {"now-scraping": self.__method_ref[key]})
                        pbar.refresh()
                        key(**_kwarg)
                        pbar.update(1)

        except:
            self._set_exit_program()
            raise
        finally:
            if self._exit_program:  # interrupting scraping
                pbar.set_description("scraping interrupted")

            else:  # finish scraping
                pbar.set_description("scraping completed")

            time.sleep(3)
            pbar.close()

            # quit keyboard
            keyboard.unhook_all()

            if timer is not None:
                timer.cancel()

            # update the old data
            UpdateOldData()

def main():
    st_time = input("Please enter the start time (yyyy-mm-dd): ")
    ed_time = input("Please enter the end time (yyyy-mm-dd): ")
    timer = int(input("Please enter the timer (minutes): "))

    # test
    scraper = TWSEScraper(st_time, ed_time, headless=False, timer=timer)
    # scraper = CryptoScraper(st_time, ed_time, headless=True, timer=timer)

    # test = scraper.time_intervals["day"]
    # for x in test:
    #     if x["month"] == 1:
    #         print(x["day"])

    # scraper.GetWeightedStock()
    scraper.execute(mode="single-threading")

    # scraper.GetPriceData("BTC")

    # scraper.GetMonthlyPrices(stock_num='1101', year=109, month=1)
    # scraper.execute(multithreading=False)


if __name__ == "__main__":
    main()
