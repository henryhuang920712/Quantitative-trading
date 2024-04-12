export function formatDate(originalDate) { 
    // like "2021-03-22T00:00:00.000Z"
    const date = new Date(originalDate);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
	const day = String(date.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
}

export function formatNumString(number) {
    if (number < 0) {
        return `(${(-number).toLocaleString()})`;
    } else {
        if (number === null) {
            return "0";
        }
        return number.toLocaleString();
    }
}

// should sort before calling this function
export function GetWeeklyPrices(dailyPrices) {
    let weeklyPrices = [];
    let nowWeekday = 7;
    let nowPrice = {};
    dailyPrices.forEach((price, index) => {
        const weekday = new Date(price.date).getDay();
        if (weekday < nowWeekday) {
            // if not the first data, push the last weekly price
            if (index !== 0) {
                weeklyPrices.push(nowPrice);
            }
            nowPrice = {
                date: price.date,
                open: price.open,
                high: price.high,
                low: price.low,
                close: price.close,
                volume: price.volume
            };
        } else {
            
            nowPrice.high = Math.max(nowPrice.high, price.high);
            nowPrice.low = Math.min(nowPrice.low, price.low);
            nowPrice.close = price.close;
            nowPrice.volume += price.volume;
            if (index === dailyPrices.length - 1) {
                weeklyPrices.push(nowPrice);
            }
        }
        nowWeekday = weekday;
    })

    return weeklyPrices;
}

export function GetMonthlyPrices(dailyPrices) {
    let monthlyPrices = [];
    let nowMonth = -1;
    let nowPrice = {};
    dailyPrices.forEach((price, index) => {
        const month = new Date(price.date).getMonth();
        if (month !== nowMonth) {
            // if not the first data, push the last monthly price
            if (index !== 0) {
                monthlyPrices.push(nowPrice);
            }
            nowPrice = {
                date: price.date,
                open: price.open,
                high: price.high,
                low: price.low,
                close: price.close,
                volume: price.volume
            };
        } else {
            nowPrice.high = Math.max(nowPrice.high, price.high);
            nowPrice.low = Math.min(nowPrice.low, price.low);
            nowPrice.close = price.close;
            nowPrice.volume += price.volume;
            if (index === dailyPrices.length - 1) {
                monthlyPrices.push(nowPrice);
            }
        }
        nowMonth = month;
    })

    return monthlyPrices;
}