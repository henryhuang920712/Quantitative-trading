import pyodbc
import yfinance as yf
from datetime import datetime
import pymongo
from decimal import Decimal
import math
import csv

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["trading-project"]
collection = db["stock-num"]
mongo_data = collection.find()

server = 'trading-project-server.database.windows.net'
database = 'trading-project'
username = 'henryhuang920712'
password = '{mondrole20116@}'
connection_string = "Driver={ODBC Driver 18 for SQL Server};Server=tcp:trading-project-server.database.windows.net,1433;" \
    + f"Database={database};" \
    + f"Uid={username};" + f"Pwd={password};" + "Encrypt=yes;TrustServerCertificate=no;Connection Timeout=10;"


# connect to the database
conn = pyodbc.connect(connection_string)
cursor = conn.cursor()
cursor.fast_executemany = True


def insert_basic_info():
    arranges = []

    for now_data in mongo_data:
        arranged = {}
        stock_num = now_data["_id"]
        arranged["symbol"] = stock_num
        arranged["shortName"] = now_data["名稱"]
        arranged["ISINCode"] = now_data["國際證券辨識號碼(ISIN Code)"]
        arranged["ListingDate"] = now_data["上市日"]
        arranged["MarketType"] = now_data["市場別"]
        arranged["IndustryType"] = now_data["產業別"]
        arranged["CFICode"] = now_data["CFICode"]
        arranged["Remarks"] = now_data["備註"]

        # '公司名稱', '董事長', '發言人', '發言人電話', '公司成立日期', '實收資本額', '上櫃日期', '公開發行日期', '已發行普通股數或TDR
        # 原股發行股數', '普通股盈餘分派或虧損撥補頻率', '股票過戶機構', '本公司', '英文通訊地址(街巷弄號)', '傳真機號碼', '投資人關係聯絡人', '投資人關係聯絡電話', '變更前名稱', '變更前簡稱']
        arranged["CompanyName"] = now_data["basic_info"].get("公司名稱", "")
        arranged["Chairman"] = now_data["basic_info"].get("董事長", "")
        arranged["Spokesperson"] = now_data["basic_info"].get("發言人", "")
        arranged["SpokespersonPhone"] = now_data["basic_info"].get("發言人電話", "")
        arranged["EstablishmentDate"] = now_data["basic_info"].get("公司成立日期", "")
        arranged["PaidInCapital"] = str(round(float(now_data["basic_info"].get("實收資本額", 0).replace(",", "").replace("元", "").split(" ")[0]), 2))
        arranged["OTCDate"] = now_data["basic_info"].get("上櫃日期", "")
        arranged["IPODate"] = now_data["basic_info"].get("公開發行日期", "")
        arranged["IssuedShares"] = int(now_data["basic_info"].get("已發行普通股數或TDR原股發行股數", 0).replace(",", "").replace("股", "").split(" ")[0])
        arranged["EarningsDistributionFrequency"] = now_data["basic_info"].get("普通股盈餘分派或虧損撥補頻率", "")
        arranged["StockTransferAgent"] = now_data["basic_info"].get("股票過戶機構", "")
        arranged["EnglishAddress"] = now_data["basic_info"].get("英文通訊地址(街巷弄號)", "")
        arranged["FaxNumber"] = now_data["basic_info"].get("傳真機號碼", "")
        arranged["IRContactPerson"] = now_data["basic_info"].get("投資人關係聯絡人", "")
        arranged["IRContactPhone"] = now_data["basic_info"].get("投資人關係聯絡電話", "")
        arranged["PreviousName"] = now_data["basic_info"].get("變更前名稱", "")
        arranged["PreviousAbbreviation"] = now_data["basic_info"].get("變更前簡稱", "")

        arranges.append(arranged)
    # delete the table "basic_info" if it exists
    cursor.execute('''
        DROP TABLE IF EXISTS basic_info
    ''')
    # create a new table "basic_info"
    cursor.execute('''
    CREATE TABLE basic_info (
        id INT IDENTITY(1,1) PRIMARY KEY,
        symbol NVARCHAR(20),
        shortName NVARCHAR(30),
        ISINCode NVARCHAR(30),
        CompanyName NVARCHAR(255),
        Chairman NVARCHAR(255),
        Spokesperson NVARCHAR(255),
        SpokespersonPhone NVARCHAR(50),
        EstablishmentDate NVARCHAR(50),
        PaidInCapital DECIMAL(20, 2),
        ListingDate NVARCHAR(50),
        OTCDate NVARCHAR(50),
        IPODate NVARCHAR(50),
        IssuedShares BIGINT,
        EarningsDistributionFrequency NVARCHAR(50),
        StockTransferAgent NVARCHAR(255),
        EnglishAddress NVARCHAR(255),
        FaxNumber NVARCHAR(50),
        IRContactPerson NVARCHAR(255),
        IRContactPhone NVARCHAR(50),
        PreviousName NVARCHAR(255),
        PreviousAbbreviation NVARCHAR(40),
        MarketType NVARCHAR(50),
        IndustryType NVARCHAR(255),
        CFICode NVARCHAR(30),
        Remarks NVARCHAR(MAX)
    )
    ''')
    # Create a parameterized query
    query = '''
    INSERT INTO basic_info (symbol, shortName, ISINCode, CompanyName, 
    Chairman, Spokesperson, SpokespersonPhone, EstablishmentDate, 
    PaidInCapital, ListingDate, OTCDate, IPODate, IssuedShares, 
    EarningsDistributionFrequency, StockTransferAgent, EnglishAddress, 
    FaxNumber, IRContactPerson, IRContactPhone, PreviousName, 
    PreviousAbbreviation, MarketType, IndustryType, CFICode, Remarks)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    '''
    # Execute the query with a list of parameters for each record
    cursor.executemany(query, [(data["symbol"], data["shortName"], data["ISINCode"], 
                                data["CompanyName"], data["Chairman"], data["Spokesperson"], 
                                data["SpokespersonPhone"], data["EstablishmentDate"], data["PaidInCapital"], 
                                data["ListingDate"], data["OTCDate"], data["IPODate"], data["IssuedShares"], 
                                data["EarningsDistributionFrequency"], data["StockTransferAgent"], 
                                data["EnglishAddress"], data["FaxNumber"], data["IRContactPerson"], 
                                data["IRContactPhone"], data["PreviousName"], data["PreviousAbbreviation"], 
                                data["MarketType"], data["IndustryType"], data["CFICode"], data["Remarks"]) for data in arranges])
    conn.commit()

# # delete the table "prices"


def insert_price_data(stock_num):
    # create a new table "prices"
    cursor.execute('''
    DROP TABLE IF EXISTS prices
    ''')
    cursor.execute('''
    CREATE TABLE prices (
        id INT IDENTITY(1,1) PRIMARY KEY,
        symbol NVARCHAR(10),
        date DATE,
        [open] FLOAT,
        high FLOAT,
        low FLOAT,
        [close] FLOAT,
        adj_close FLOAT,
        volume INT,
        dividend FLOAT,
        stock_split FLOAT,
        origin NVARCHAR(10)
    )
    ''')
    print(stock_num)
    today = datetime.today().strftime("%Y-%m-%d")
    data = yf.download(f"{stock_num}.TW", start="2020-01-01", end=today, actions=True)
    data = data.reset_index()
    data = data.to_dict('records')
    if len(data) == 0:
        return

    # get the count of records with symbol = stock_num
    cursor.execute(f'''
    SELECT COUNT(*)
    FROM prices
    WHERE symbol = '{stock_num}'
    ''')

    count = cursor.fetchone()[0]

    if count > 0:
        return

    # Create a parameterized query
    query = '''
    INSERT INTO prices (symbol, date, [open], high, low, [close], adj_close, volume, dividend, stock_split, origin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    '''
    # Execute the query with a list of parameters for each record
    cursor.executemany(query, [(stock_num,  item["Date"], item["Open"], item["High"], item["Low"], item["Close"], 
                                item["Adj Close"], item["Volume"], item["Dividends"], item["Stock Splits"], "yf") for item in data])
    conn.commit()


def insert_bal_sheet():
    arranges = []

    # '央行及同業融資', '無形資產', '透過損益按公允價值衡量之金融負債', '附買回票券及債券負債', '本期所得稅資產', '避險之衍生金融資產', '投資', '其他資產-淨額', '短期債務', '庫藏股票', '存放央行及拆借金融同業', '無形資產-淨額', '權益總額', '租賃負債', '存放央行及拆借銀行同業', '使用權資產-淨額', '其他金融資產-淨額', '投資性不動產投資-淨額', '貼現及放款-淨額', '公司代號', '權益總計', '再保險合約資產-淨額', '公司名稱', '待出售資產-淨額', '歸屬於母公司業主之權益', '應付金融債券', '其他金融負債', '受限制資產-淨額', '共同控制下前手權益', '透過其他綜合損益按公允價值衡量之金融資產', '合併前非屬共同控制股權', '保留盈餘(或累積虧損)', '流動資 產', '投資性不動產-淨額', '非控制權益', '與待出售資產直接相關之負債', '特別股負債', '母公司暨子公司所持有之母公司庫藏股股數(單位:股)', '再保險合約資產', '預收股款(權益項下)之約當發行股數(單位:股)', '避險之衍生金融負債', '央行及銀行同業存款', '分離帳戶保險商品負債', '避險之衍生金融負債-淨額', '其他負債', '採用權益法之投資-淨額', '避險之衍生金融資產淨額', '待註銷股本股數(單位:股)', '外匯價格變動準備', '負債準備', '使用權資產', '具金融商品性質之保險契約準備', '待分配予業主之資產-淨額', '遞延所得稅負債', '流動負債', '保險負債', '資本公積', '非流動負債', '母公司暨子公司持有之母公司庫藏股股數(單位:股)', '每股參考淨值', '應收款項-淨額', ' 當期所得稅負債', '待出售資產', '非流動資產', '透過損益按公允價值衡量之金融資產', '本期所得稅負債', '資產總額', '歸屬於母公司業主權益合計', '保留盈餘', '其他權益', '應付商業本票-淨額', '負債總額', '按攤銷後成本衡量之債務工具投資', '負債總計', '現金及約當現金', '遞延所得稅資產', '央行及金融同業存款', '分離帳戶保險商品資 產', '當期所得稅資產', '不動產及設備', '附賣回票券及債券投資淨額', '其他資產', '應付債券', '不動產及設備-淨額', '其他借款', '附賣回票券及債券投資', '應收款項', '待分配予業主之資產(或處分群組)', '資產總計', '存款及匯款', '應付款項', '權益-具證券性質之虛擬通貨', '股本', '歸屬於母公司業主之權益合計', '應付公司債'
    for now_data in mongo_data:
        stock_num = now_data["_id"]
        for key_string, bal_item in now_data["balance_sheet"].items():
            arranged = {}
            date = key_string.split("-")[2:]
            arranged["symbol"] = stock_num
            year, month, day = int(date[0]) + 1911, int(date[2]), int(date[3])
            # convert the date to the format "yyyy-mm-dd"
            date_str = f"{year}-{month:02d}-{day:02d}"
            arranged["date"] = date_str

            for key, value in bal_item.items():
                revised_key = key.replace(" ", "").replace("─", "-").replace("（", "(")\
                .replace("）", ")").replace(" ", "").replace("、", ",").replace("：", ":")\
                .replace("。", ".").replace("，", ",").replace("　", "").replace("－", "-")
                if len(revised_key) == 0:
                    continue
                if revised_key == "公司名稱":
                    revised_value = value
                else:
                    revised_value = f'{round(float(value.replace(",", "").replace("元", "").replace("，", "").replace("--", "0"))):.2f}'

                arranged[revised_key] = revised_value

            arranges.append(arranged)

    # delete the table "balance_sheet" if it exists
    cursor.execute('''
        DROP TABLE IF EXISTS balance_sheet
    ''')

    # create a new table "balance_sheet"
    cursor.execute('''
    CREATE TABLE balance_sheet (
        id INT IDENTITY(1,1) PRIMARY KEY,
        symbol NVARCHAR(20),
        date DATE,
        [央行及同業融資] DECIMAL(20, 2),
        [無形資產] DECIMAL(20, 2),
        [透過損益按公允價值衡量之金融負債] DECIMAL(20, 2),
        [附買回票券及債券負債] DECIMAL(20, 2),
        [本期所得稅資產] DECIMAL(20, 2),
        [避險之衍生金融資產] DECIMAL(20, 2),
        [投資] DECIMAL(20, 2),
        [其他資產-淨額] DECIMAL(20, 2),
        [短期債務] DECIMAL(20, 2),
        [庫藏股票] DECIMAL(20, 2),
        存放央行及拆借金融同業 DECIMAL(20, 2),
        [無形資產-淨額] DECIMAL(20, 2),
        權益總額 DECIMAL(20, 2),
        租賃負債 DECIMAL(20, 2),
        存放央行及拆借銀行同業 DECIMAL(20, 2),
        [使用權資產-淨額] DECIMAL(20, 2),
        [其他金融資產-淨額] DECIMAL(20, 2),
        [投資性不動產投資-淨額] DECIMAL(20, 2),
        [貼現及放款-淨額] DECIMAL(20, 2),
        公司代號 NVARCHAR(20),
        權益總計 DECIMAL(20, 2),
        [再保險合約資產-淨額] DECIMAL(20, 2),
        公司名稱 NVARCHAR(255),
        [待出售資產-淨額] DECIMAL(20, 2),
        歸屬於母公司業主之權益 DECIMAL(20, 2),
        應付金融債券 DECIMAL(20, 2),
        其他金融負債 DECIMAL(20, 2),
        [受限制資產-淨額] DECIMAL(20, 2),
        共同控制下前手權益 DECIMAL(20, 2),
        透過其他綜合損益按公允價值衡量之金融資產 DECIMAL(20, 2),
        合併前非屬共同控制股權 DECIMAL(20, 2),
        [保留盈餘(或累積虧損)] DECIMAL(20, 2),
        流動資產 DECIMAL(20, 2),
        [投資性不動產-淨額] DECIMAL(20, 2),
        非控制權益 DECIMAL(20, 2),
        與待出售資產直接相關之負債 DECIMAL(20, 2),
        特別股負債 DECIMAL(20, 2),
        母公司暨子公司所持有之母公司庫藏股股數 DECIMAL(20, 2),
        再保險合約資產 DECIMAL(20, 2),
        [預收股款(權益項下)之約當發行股數] DECIMAL(20, 2),
        避險之衍生金融負債 DECIMAL(20, 2),
        央行及銀行同業存款 DECIMAL(20, 2),
        分離帳戶保險商品負債 DECIMAL(20, 2),
        [避險之衍生金融負債-淨額] DECIMAL(20, 2),
        其他負債 DECIMAL(20, 2),
        [採用權益法之投資-淨額] DECIMAL(20, 2),
        避險之衍生金融資產淨額 DECIMAL(20, 2),
        待註銷股本股數 DECIMAL(20, 2),
        外匯價格變動準備 DECIMAL(20, 2),
        負債準備 DECIMAL(20, 2),
        使用權資產 DECIMAL(20, 2),
        具金融商品性質之保險契約準備 DECIMAL(20, 2),
        [待分配予業主之資產-淨額] DECIMAL(20, 2),
        遞延所得稅負債 DECIMAL(20, 2),
        流動負債 DECIMAL(20, 2),
        保險負債 DECIMAL(20, 2),
        資本公積 DECIMAL(20, 2),
        非流動負債 DECIMAL(20, 2),
        母公司暨子公司持有之母公司庫藏股股數 DECIMAL(20, 2),
        每股參考淨值 DECIMAL(20, 2),
        [應收款項-淨額] DECIMAL(20, 2),
        當期所得稅負債 DECIMAL(20, 2),
        待出售資產 DECIMAL(20, 2),
        非流動資產 DECIMAL(20, 2),
        透過損益按公允價值衡量之金融資產 DECIMAL(20, 2),
        本期所得稅負債 DECIMAL(20, 2),
        資產總額 DECIMAL(20, 2),
        歸屬於母公司業主權益合計 DECIMAL(20, 2),
        保留盈餘 DECIMAL(20, 2),
        其他權益 DECIMAL(20, 2),
        [應付商業本票-淨額] DECIMAL(20, 2),
        負債總額 DECIMAL(20, 2),
        按攤銷後成本衡量之債務工具投資 DECIMAL(20, 2),
        負債總計 DECIMAL(20, 2),
        現金及約當現金 DECIMAL(20, 2),
        遞延所得稅資產 DECIMAL(20, 2),
        央行及金融同業存款 DECIMAL(20, 2),
        分離帳戶保險商品資產 DECIMAL(20, 2),
        當期所得稅資產 DECIMAL(20, 2),
        不動產及設備 DECIMAL(20, 2),
        附賣回票券及債券投資淨額 DECIMAL(20, 2),
        其他資產 DECIMAL(20, 2),
        應付債券 DECIMAL(20, 2),
        [不動產及設備-淨額] DECIMAL(20, 2),
        其他借款 DECIMAL(20, 2),
        附賣回票券及債券投資 DECIMAL(20, 2),
        應收款項 DECIMAL(20, 2),
        [待分配予業主之資產(或處分群組)] DECIMAL(20, 2),
        資產總計 DECIMAL(20, 2),
        存款及匯款 DECIMAL(20, 2),
        應付款項 DECIMAL(20, 2),
        [權益-具證券性質之虛擬通貨] DECIMAL(20, 2),
        股本 DECIMAL(20, 2),
        歸屬於母公司業主之權益合計 DECIMAL(20, 2),
        應付公司債 DECIMAL(20, 2)
    )
    ''')

    # Create a parameterized query
    query = '''
    INSERT INTO balance_sheet (symbol, date, 央行及同業融資, 無形資產, 透過損益按公允價值衡量之金融負債, 
    附買回票券及債券負債, 本期所得稅資產, 避險之衍生金融資產, 投資, [其他資產-淨額], 短期債務, 庫藏股票, 
    存放央行及拆借金融同業, [無形資產-淨額], 權益總額, 租賃負債, 存放央行及拆借銀行同業, [使用權資產-淨額], 
    [其他金融資產-淨額], [投資性不動產投資-淨額], [貼現及放款-淨額], 公司代號, 權益總計, [再保險合約資產-淨額], 
    公司名稱, [待出售資產-淨額], 歸屬於母公司業主之權益, 應付金融債券, 其他金融負債, [受限制資產-淨額], 
    共同控制下前手權益, 透過其他綜合損益按公允價值衡量之金融資產, 合併前非屬共同控制股權, [保留盈餘(或累積虧損)], 
    流動資產, [投資性不動產-淨額], 非控制權益, 與待出售資產直接相關之負債, 特別股負債, 母公司暨子公司所持有之母公司庫藏股股數,
    再保險合約資產, [預收股款(權益項下)之約當發行股數], 避險之衍生金融負債, 央行及銀行同業存款, 分離帳戶保險商品負債,
    [避險之衍生金融負債-淨額], 其他負債, [採用權益法之投資-淨額], 避險之衍生金融資產淨額, 待註銷股本股數, 外匯價格變動準備,
    負債準備, 使用權資產, 具金融商品性質之保險契約準備, [待分配予業主之資產-淨額], 遞延所得稅負債, 流動負債, 保險負債, 資本公積,
    非流動負債, 母公司暨子公司持有之母公司庫藏股股數, 每股參考淨值, [應收款項-淨額], 當期所得稅負債, 待出售資產, 非流動資產,
    透過損益按公允價值衡量之金融資產, 本期所得稅負債, 資產總額, 歸屬於母公司業主權益合計, 保留盈餘, 其他權益, [應付商業本票-淨額],
    負債總額, 按攤銷後成本衡量之債務工具投資, 負債總計, 現金及約當現金, 遞延所得稅資產, 央行及金融同業存款, 分離帳戶保險商品資產,
    當期所得稅資產, 不動產及設備, 附賣回票券及債券投資淨額, 其他資產, 應付債券, [不動產及設備-淨額], 其他借款, 附賣回票券及債券投資,
    應收款項, [待分配予業主之資產(或處分群組)], 資產總計, 存款及匯款, 應付款項, [權益-具證券性質之虛擬通貨], 股本, 歸屬於母公司業主之權益合計,
    應付公司債)
    VALUES (
        ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
    )
    '''
    # Execute the query with a list of parameters for each record
    cursor.executemany(query, [(data["symbol"], data["date"], data.get("央行及同業融資", 0), data.get("無形資產", 0), data.get("透過損益按公允價值衡量之金融負債", 0),
                                data.get("附買回票券及債券負債", 0), data.get("本期所得稅資產", 0), data.get("避險之衍生金融資產", 0), data.get("投資", 0), 
                                data.get("其他資產-淨額", 0), data.get("短期債務", 0), data.get("庫藏股票", 0), data.get("存放央行及拆借金融同業", 0), 
                                data.get("無形資產-淨額", 0), data.get("權益總額", 0), data.get("租賃負債", 0), data.get("存放央行及拆借銀行同業", 0), 
                                data.get("使用權資產-淨額", 0), data.get("其他金融資產-淨額", 0), data.get("投資性不動產投資-淨額", 0), 
                                data.get("貼現及放款-淨額", 0), data.get("公司代號", 0), data.get("權益總計", 0), data.get("再保險合約資產-淨額", 0), 
                                data.get("公司名稱", 0), data.get("待出售資產-淨額", 0), data.get("歸屬於母公司業主之權益", 0), 
                                data.get("應付金融債券", 0), data.get("其他金融負債", 0), data.get("受限制資產-淨額", 0), 
                                data.get("共同控制下前手權益", 0), data.get("透過其他綜合損益按公允價值衡量之金融資產", 0),
                                data.get("合併前非屬共同控制股權", 0), data.get("保留盈餘(或累積虧損)", 0), data.get("流動資產", 0),
                                data.get("投資性不動產-淨額", 0), data.get("非控制權益", 0), data.get("與待出售資產直接相關之負債", 0),
                                data.get("特別股負債", 0), data.get("母公司暨子公司所持有之母公司庫藏股股數", 0),
                                data.get("再保險合約資產", 0), data.get("預收股款(權益項下)之約當發行股數", 0),
                                data.get("避險之衍生金融負債", 0), data.get("央行及銀行同業存款", 0),
                                data.get("分離帳戶保險商品負債", 0), data.get("避險之衍生金融負債-淨額", 0),
                                data.get("其他負債", 0), data.get("採用權益法之投資-淨額", 0),
                                data.get("避險之衍生金融資產淨額", 0), data.get("待註銷股本股數", 0),
                                data.get("外匯價格變動準備", 0), data.get("負債準備", 0), data.get("使用權資產", 0),
                                data.get("具金融商品性質之保險契約準備", 0), data.get("待分配予業主之資產-淨額", 0),
                                data.get("遞延所得稅負債", 0), data.get("流動負債", 0), data.get("保險負債", 0),
                                data.get("資本公積", 0), data.get("非流動負債", 0),
                                data.get("母公司暨子公司持有之母公司庫藏股股數", 0), data.get("每股參考淨值", 0),
                                data.get("應收款項-淨額", 0), data.get("當期所得稅負債", 0), data.get("待出售資產", 0),
                                data.get("非流動資產", 0), data.get("透過損益按公允價值衡量之金融資產", 0),
                                data.get("本期所得稅負債", 0), data.get("資產總額", 0), data.get("歸屬於母公司業主權益合計", 0),
                                data.get("保留盈餘", 0), data.get("其他權益", 0), data.get("應付商業本票-淨額", 0),
                                data.get("負債總額", 0), data.get("按攤銷後成本衡量之債務工具投資", 0),
                                data.get("負債總計", 0), data.get("現金及約當現金", 0), data.get("遞延所得稅資產", 0),
                                data.get("央行及金融同業存款", 0), data.get("分離帳戶保險商品資產", 0),
                                data.get("當期所得稅資產", 0), data.get("不動產及設備", 0),
                                data.get("附賣回票券及債券投資淨額", 0), data.get("其他資產", 0),
                                data.get("應付債券", 0), data.get("不動產及設備-淨額", 0),
                                data.get("其他借款", 0), data.get("附賣回票券及債券投資", 0),
                                data.get("應收款項", 0), data.get("待分配予業主之資產(或處分群組)", 0),
                                data.get("資產總計", 0), data.get("存款及匯款", 0), data.get("應付款項", 0),
                                data.get("權益-具證券性質之虛擬通貨", 0), data.get("股本", 0),
                                data.get("歸屬於母公司業主之權益合計", 0), data.get("應付公司債", 0)
                                ) for data in arranges])



    conn.commit()

def insert_sales():
    arranges = []

    # {'出表日期': '112/07/24', '資料年月': '109/1', '公司名稱': '亞泥', '產業別': '水泥工業', '營業收入-當月營收': 5210319, '營業收入-上月營收': 8115203, '營業收入- 去年當月營收': 7905737, '營業收入-上月比較增減(%)': -35.79558022146827, '營業收入-去年同月增減(%)': -34.094455709821865, '累計營業收入-當月累計營收': 5210319, '累計營業收入-去年累計營收': 7905737, '累計營業收入-前期比較增減(%)': -34.094455709821865, '備註': '-'}

    for now_data in mongo_data:
        stock_num = now_data["_id"]
        for key_string, sales_item in now_data["sales"].items():
            arranged = {}
            date = key_string.split("-")[2:]
            arranged["symbol"] = stock_num
            year, month, day = int(date[0]) + 1911, int(date[2]), int(date[3])
            formatted_date = datetime(year, month, day).strftime("%Y-%m-%d")
            arranged["date"] = formatted_date

            for key, value in sales_item.items():
                if key == "出表日期":
                    continue
                elif key == "公司名稱" or key == "產業別" or key == "備註" or key == "資料年月":
                    revised_value = str(value)
                else:
                    # if stock_num == "1340" and formatted_date == "2020-03-01" and key == "營業收入-上月比較增減(%)":
                    #     print(value)
                    #     print(type(value))
                    if type(value) == str:
                        revised_value = Decimal(f'{round(float(value.replace(",", "").replace("元", "")), 2):.2f}')
                    else:
                        if math.isnan(value):
                            revised_value = Decimal("0.00")
                            print(f"stock_num: {stock_num}, date: {formatted_date}, key: {key}, value: {value}")
                        else:
                            revised_value = Decimal(f'{value:.2f}')
                arranged[key] = revised_value

            arranges.append(arranged)

    # # turn arranges into df
    # import pandas as pd
    # df = pd.DataFrame(arranges)
    # pd.set_option('display.max_rows', None)
    # pd.set_option('display.max_columns', None)

    # # turn column number 5 to 12 into float
    # for i in range(5, 13):
    #     for j in range(len(arranges)):
    #         try:
    #             df.iloc[j, i] = float(df.iloc[j, i])
    #         except:
    #             print(df.iloc[j, i])
    #             print(type(df.iloc[j, i]))

    # print(df.describe())

    # delete the table "sales" if it exists
    cursor.execute('''
        DROP TABLE IF EXISTS [dbo].[sales]
    ''')

    # create a new table "sales"
    cursor.execute('''
    CREATE TABLE [dbo].[sales] (
        id INT IDENTITY(1,1) PRIMARY KEY,
        symbol NVARCHAR(40),
        date DATE,
        公司名稱 NVARCHAR(255),
        產業別 NVARCHAR(255),
        資料年月 NVARCHAR(255),
        [營業收入-當月營收] DECIMAL(35, 2),
        [營業收入-上月營收] DECIMAL(35, 2),
        [營業收入-去年當月營收] DECIMAL(35, 2),
        [營業收入-上月比較增減(%)] DECIMAL(10, 2),
        [營業收入-去年同月增減(%)] DECIMAL(10, 2),
        [累計營業收入-當月累計營收] DECIMAL(35, 2),
        [累計營業收入-去年累計營收] DECIMAL(35, 2),
        [累計營業收入-前期比較增減(%)] DECIMAL(10, 2),
        備註 NVARCHAR(MAX)
    )
    ''')

    # Create a parameterized query
    query = '''
    INSERT INTO [dbo].[sales] (symbol, date, 公司名稱, 產業別, 資料年月, [營業收入-當月營收], [營業收入-上月營收], [營業收入-去年當月營收], 
    [營業收入-上月比較增減(%)], [營業收入-去年同月增減(%)], [累計營業收入-當月累計營收], [累計營業收入-去年累計營收], [累計營業收入-前期比較增減(%)], 備註)
    VALUES (
        ?,?,?,?,?,?,?,?,?,?,?,?,?,?
    )
    '''
    
    # Execute the query with a list of parameters for each record
    try:
        cursor.executemany(query, [(data["symbol"], data["date"], data["公司名稱"], data["產業別"], data["資料年月"], 
                                    data["營業收入-當月營收"], data["營業收入-上月營收"], data["營業收入-去年當月營收"],
                                    data["營業收入-上月比較增減(%)"], data["營業收入-去年同月增減(%)"],
                                    data["累計營業收入-當月累計營收"], data["累計營業收入-去年累計營收"],
                                    data["累計營業收入-前期比較增減(%)"], data["備註"]) for data in arranges])
        
        conn.commit()
    except Exception as e:
        print(e)

def insert_trading_info():
    arranges = []
    # ['自營商賣出股數(避險)', '自營商買賣超股數(自行買賣)', '自營商買賣超股數', '自營商買進股數(避險)', '自營商買賣超股數(避險)', '證券名稱', '外資自營商買進股數', '三大法人買賣超股數', '自營商賣出股數(自行買賣)', '外資自營商賣出股數', '外陸資賣出股數(不含外資自營商)', '投信買賣超股數', '外資自營商買賣超股數', '外陸資買進股數(不含外資自營商)', '證券代號', '外陸資買賣超股數(不含外資自營商)', '投信買進股數', '自營商買進股數(自行買賣)', '投信賣出股數']
    now_name = []
    for now_data in mongo_data:
        stock_num = now_data["_id"]
        stock_name = now_data["名稱"]

        for key_string, trading_info in now_data["trading_info"].items():
            arranged = {}
            now_name.append(stock_name)
            date = key_string.split("-")[2:]
            arranged["symbol"] = stock_num
            year, month, day = int(date[0]) + 1911, int(date[2]), int(date[3])
            formatted_date = datetime(year, month, day).strftime("%Y-%m-%d")
            arranged["date"] = formatted_date
            if "證券名稱" not in trading_info:
                trading_info["證券名稱"] = stock_name
            
            for key, value in trading_info.items():
                if key == "證券代號":
                    continue
                elif key == "證券名稱":
                    revised_value = str(value)
                else:
                    if type(value) == str:
                        try:
                            revised_value = Decimal(f'{round(float(value.replace(",", "")), 2):.2f}')
                        except:
                            print(value)
                            print(type(value))
                    else:
                        if math.isnan(value):
                            revised_value = Decimal("0.00")
                            print(f"stock_num: {stock_num}, date: {formatted_date}, key: {key}, value: {value}")
                        else:
                            revised_value = Decimal(f'{value:.2f}')
                arranged[key] = revised_value

            arranges.append(arranged)

    cursor.execute('''
        DROP TABLE IF EXISTS names
    ''')
    
    cursor.execute('''
        CREATE TABLE names
        (name NVARCHAR(255))
    ''')

    # add now_name to the table
    cursor.executemany('''
        INSERT INTO names (name)
        VALUES (?)
    ''', [(name,) for name in now_name])

    print(now_name[:50])

    # # delete the table "trading_info" if it exists
    # cursor.execute('''
    #     DROP TABLE IF EXISTS [dbo].[trading_info]
    # ''')

    # # create a new table "trading_info"
    # cursor.execute('''
    #     CREATE TABLE [dbo].[trading_info] (
    #         id INT IDENTITY(1,1) PRIMARY KEY,
    #         symbol NVARCHAR(20),
    #         date DATE,
    #         證券名稱 NVARCHAR(255),
    #         [自營商賣出股數(避險)] DECIMAL(35, 2),
    #         [自營商買賣超股數(自行買賣)] DECIMAL(35, 2),
    #         [自營商買賣超股數] DECIMAL(35, 2),
    #         [自營商買進股數(避險)] DECIMAL(35, 2),
    #         [自營商買賣超股數(避險)] DECIMAL(35, 2),
    #         [外資自營商買進股數] DECIMAL(35, 2),
    #         [三大法人買賣超股數] DECIMAL(35, 2),
    #         [自營商賣出股數(自行買賣)] DECIMAL(35, 2),
    #         [外資自營商賣出股數] DECIMAL(35, 2),
    #         [外陸資賣出股數(不含外資自營商)] DECIMAL(35, 2),
    #         [投信買賣超股數] DECIMAL(35, 2),
    #         [外資自營商買賣超股數] DECIMAL(35, 2),
    #         [外陸資買進股數(不含外資自營商)] DECIMAL(35, 2),
    #         [外陸資買賣超股數(不含外資自營商)] DECIMAL(35, 2),
    #         [投信買進股數] DECIMAL(35, 2),
    #         [自營商買進股數(自行買賣)] DECIMAL(35, 2),
    #         [投信賣出股數] DECIMAL(35, 2)
    #     )
                   
    # ''')

    # Create a parameterized query
    # query = '''
    # INSERT INTO [dbo].[trading_info] (symbol, date, 證券名稱, [自營商賣出股數(避險)], [自營商買賣超股數(自行買賣)], [自營商買賣超股數], 
    # [自營商買進股數(避險)], [自營商買賣超股數(避險)], [外資自營商買進股數], [三大法人買賣超股數], [自營商賣出股數(自行買賣)], 
    # [外資自營商賣出股數], [外陸資賣出股數(不含外資自營商)], [投信買賣超股數], [外資自營商買賣超股數], [外陸資買進股數(不含外資自營商)], 
    # [外陸資買賣超股數(不含外資自營商)], [投信買進股數], [自營商買進股數(自行買賣)], [投信賣出股數])
    # VALUES (
    #     ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
    # )
    # '''
    # def insert_dict(key,data):
    #     try:
    #         if type(data[key]) != Decimal:
    #             return Decimal("0.00")
    #     except KeyError:
    #         return Decimal("0.00")

    # arranged_t = []
    # for data in arranges:
    #     data["自營商賣出股數(避險)"] = insert_dict("自營商賣出股數(避險)",data)
    #     data["自營商買賣超股數(自行買賣)"] = insert_dict("自營商買賣超股數(自行買賣)",data)
    #     data["自營商買賣超股數"] = insert_dict("自營商買賣超股數",data)
    #     data["自營商買進股數(避險)"] = insert_dict("自營商買進股數(避險)",data)
    #     data["自營商買賣超股數(避險)"] = insert_dict("自營商買賣超股數(避險)",data)
    #     data["外資自營商買進股數"] = insert_dict("外資自營商買進股數",data)
    #     data["三大法人買賣超股數"] = insert_dict("三大法人買賣超股數",data)
    #     data["自營商賣出股數(自行買賣)"] = insert_dict("自營商賣出股數(自行買賣)",data)
    #     data["外資自營商賣出股數"] = insert_dict("外資自營商賣出股數",data)
    #     data["外陸資賣出股數(不含外資自營商)"] = insert_dict("外陸資賣出股數(不含外資自營商)",data)
    #     data["投信買賣超股數"] = insert_dict("投信買賣超股數",data)
    #     data["外資自營商買賣超股數"] = insert_dict("外資自營商買賣超股數",data)
    #     data["外陸資買進股數(不含外資自營商)"] = insert_dict("外陸資買進股數(不含外資自營商)",data)
    #     data["外陸資買賣超股數(不含外資自營商)"] = insert_dict("外陸資買賣超股數(不含外資自營商)",data)
    #     data["投信買進股數"] = insert_dict("投信買進股數",data)
    #     data["自營商買進股數(自行買賣)"] = insert_dict("自營商買進股數(自行買賣)",data)
    #     data["投信賣出股數"] = insert_dict("投信賣出股數",data)

    #     arranged_t.append((data["symbol"], data["date"], data["證券名稱"], data["自營商賣出股數(避險)"], data["自營商買賣超股數(自行買賣)"], data["自營商買賣超股數"],
    #                         data["自營商買進股數(避險)"], data["自營商買賣超股數(避險)"], data["外資自營商買進股數"], data["三大法人買賣超股數"], 
    #                         data["自營商賣出股數(自行買賣)"], data["外資自營商賣出股數"], data["外陸資賣出股數(不含外資自營商)"], 
    #                         data["投信買賣超股數"], data["外資自營商買賣超股數"], data["外陸資買進股數(不含外資自營商)"], 
    #                         data["外陸資買賣超股數(不含外資自營商)"], data["投信買進股數"], data["自營商買進股數(自行買賣)"], 
    #                         data["投信賣出股數"]))
        

    # # Execute the query with a list of parameters for each record
    # cursor.executemany(query, arranged_t)
            
    
    conn.commit()

def insert_inc_statement():
    # ['營業外損益', '合併前非屬共同控制股權損益', '收益', '支出及費用', '合併前非屬共同控制股權綜合損益淨額', '支出', '營業毛利(毛損)淨額', '淨利(淨損)歸屬於母公司業主', '已實現銷貨(損)益', '綜合損益總額歸屬於非控制權益', '營業毛利(毛損)', '淨利(損)歸屬於非控制權益', '營業收入', '綜合損益總額歸屬於母公司業主', '其他綜合損益(稅後)', '營業利益', '利息以外淨損益', '綜合損益總額歸屬於共同控制下前手權益', '繼續營業單位稅前損益', '營業利益(損失)', '其他綜合損益', '營業外收入及支出', '淨利(損)歸屬於共同控制下前手權益', '其他綜合損益(稅後淨額)', '繼續營業單位稅前純益(純損)', '本期稅後淨利(淨損)', '基本每股盈餘(元)', '其他收益及費損淨額', '原始認列生物資產及農產品之利益(損失)', '收入', '本期其他綜合損益(稅後淨額)', '本期綜合損益總額(稅後)', '繼續營業單位本期純益(純損)', '生物資產當期公允價值減出售成本之變動利益(損失)', '淨利(淨損)歸屬於共同控制下前手權益', '公司代號', '其他綜合損益(淨額)', '稅前淨利(淨損)', '繼續營業單位稅前淨利(淨損)', '淨利(損)歸屬於母公司業主', '淨利(淨損)歸屬於非控制權益', '停業單位損益', '營業費用', '所得稅費用(利益)', '淨收益', '公司名稱', '保險負債準備淨變動', '所得稅(費用)利益', '繼續營業單位本期淨利(淨損)', '本期淨利(淨損)', '利息以外淨收益', '繼續營業單位本期稅後淨利(淨損)', '本期綜合損益總額', '未實現銷貨(損)益', '利息淨收益', '營業成本', '呆帳費用,承諾及保證責任準備提存']
    arranges = []

    for now_data in mongo_data:
        stock_num = now_data["_id"]
        for key_string, inc_statement in now_data["income_statement"].items():
            arranged = {}
            date = key_string.split("-")[2:]
            arranged["symbol"] = stock_num
            year, month, day = int(date[0]) + 1911, int(date[2]), int(date[3])
            formatted_date = datetime(year, month, day).strftime("%Y-%m-%d")
            arranged["date"] = formatted_date

            for key, value in inc_statement.items():
                if key == "公司名稱" or key == "公司代號":
                    revised_value = str(value)
                else:
                    if type(value) == str:
                        revised_value = Decimal(f'{round(float(value.replace(",", "").replace("元", "").replace("--", "0")), 2):.2f}')
                    else:
                        if math.isnan(value):
                            revised_value = Decimal("0.00")
                            print(f"stock_num: {stock_num}, date: {formatted_date}, key: {key}, value: {value}")
                        else:
                            revised_value = Decimal(f'{value:.2f}')
                arranged[key] = revised_value

            arranges.append(arranged)

    # delete the table "income_statement" if it exists
    cursor.execute('''
        DROP TABLE IF EXISTS [dbo].[income_statement]
    ''')

    # create a new table "income_statement"
    cursor.execute('''
    CREATE TABLE [dbo].[income_statement] (
        id INT IDENTITY(1,1) PRIMARY KEY,
        symbol NVARCHAR(40),
        date DATE,
        公司名稱 NVARCHAR(255),
        公司代號 NVARCHAR(255),
        營業收入 DECIMAL(35, 2),
        營業成本 DECIMAL(35, 2),
        營業毛利(毛損) DECIMAL(35, 2),
        營業費用 DECIMAL(35, 2),
        營業利益(損失) DECIMAL(35, 2),
        營業外收入及支出 DECIMAL(35, 2),
        營業外損益 DECIMAL(35, 2),
        稅前淨利(淨損) DECIMAL(35, 2),
        所得稅費用(利益) DECIMAL(35, 2),
        繼續營業單位本期淨利(淨損) DECIMAL(35, 2),
        停業單位損益 DECIMAL(35, 2),
        本期淨利(淨損) DECIMAL(35, 2),
        母公司業主(淨利)損益 DECIMAL(35, 2),
        非控制權益(淨利)損益 DECIMAL(35, 2),
        綜合損益總額 DECIMAL(35, 2),
        母公司業主(綜合損益)淨額 DECIMAL(35, 2),
        非控制權益(綜合損益) DECIMAL(35, 2),
        基本每股盈餘(元) DECIMAL(35, 2),
        營業外收入 DECIMAL(35, 2),
        營業外支出 DECIMAL(35, 2),
        繼續營業單位稅前淨利(淨損) DECIMAL(35, 2),
        稅前淨利(淨損) DECIMAL(35, 2),
        所得稅(費用)利益 DECIMAL(35, 2),
        繼續營業單位本期稅後淨利(淨損) DECIMAL(35, 2),
        稅後淨利(淨損) DECIMAL(35, 2),
        合併前非屬共同控制股權損益 DECIMAL(35, 2),
        合併前非屬共同控制股權綜合損益淨額 DECIMAL(35, 2),
        綜合損益總額歸屬於母公司業主 DECIMAL(35, 2),
        綜合損益總額歸屬於非控制權益 DECIMAL(35, 2),
        綜合損益總額歸屬於共同控制下前手權益 DECIMAL(35, 2),
        綜合損益總額 DECIMAL(35, 2),
        本期其他綜合損益(稅後淨額) DECIMAL(35, 2),
        本期其他綜合損益(稅後) DECIMAL(35, 2),
        本期其他綜合損益(淨額) DECIMAL(35, 2),
        本期稅後淨利(淨損) DECIMAL(35, 2),
        本期綜合損益總額(稅後) DECIMAL(35, 2),
        未實現銷貨(損)益 DECIMAL(35, 2),
        已實現銷貨(損)益 DECIMAL(35, 2),
        原始認列生物資產及農產品之利益(損失) DECIMAL(35, 2),
        其他收益及費損淨額 DECIMAL(35, 2),
        其他收益及費損淨額 DECIMAL(35, 2),
        利息以外淨收益 DECIMAL(35, 2),
        利息以外淨損益 DECIMAL(35, 2),
        利息淨收益 DECIMAL(35, 2),
        利息以外淨損益 DECIMAL(35, 2),
        呆帳費用,承諾及保證責任準備提存 DECIMAL(35, 2),
        保險負債準備淨變動 DECIMAL(35, 2),
        生物資產當期公允價值減出售成本之變動利益(損失) DECIMAL(35, 2)
    )
    ''')

# print(len(arranges[0]))
    
# insert_sales()

insert_trading_info()

# close the connection
conn.close()

