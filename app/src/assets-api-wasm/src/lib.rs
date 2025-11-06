use wasm_bindgen::prelude::*;
use js_sys::Date;
use serde::{Serialize, Deserialize};
use serde_wasm_bindgen;

#[wasm_bindgen]
extern "C" {
    fn readLocalFile(path: &str) -> String;
    fn writeLocalFile(path: &str, data: &str);
    fn getFileTimestamp(path: &str) -> f64;
    #[wasm_bindgen(catch)]
    async fn fetchRemoteText(url: &str) -> Result<JsValue, JsValue>;
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Stock {
    pub name: String,
    pub symbol: String,
    pub market: Option<String>,
    pub image: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct EnrichedStock {
    pub name: String,
    pub symbol: String,
    pub dates: Vec<String>,
    pub closePrices: Vec<f64>,
    pub dailyChange: Vec<f64>,
    pub market: Option<String>,
    pub image: Option<String>,
}

async fn fetch_or_cache(path: &str, url: &str, ttl_ms: f64) -> Result<String, JsValue> {
    let now = Date::now();
    let last_modified = getFileTimestamp(path);
    if last_modified + ttl_ms > now {
        return Ok(readLocalFile(path));
    }

    let text_js: JsValue = fetchRemoteText(url).await?;
    let text = text_js.as_string().ok_or(JsValue::from_str("Expected string from fetch"))?;
    writeLocalFile(path, &text);
    Ok(text)
}

#[wasm_bindgen]
pub async fn handler(asset: Option<String>, country: Option<String>) -> Result<JsValue, JsValue> {
    let market = country.unwrap_or("US".to_string());
    let ttl_24h = 1000.0 * 60.0 * 60.0 * 24.0;

    let stocks_path = format!("data/stocks_list_{}.json", market);
    let stocks_url = format!(
        "https://financial-data-omega.vercel.app/stocks_list_{}.json",
        market
    );

    let stocks_text = fetch_or_cache(&stocks_path, &stocks_url, ttl_24h).await?;
    let stocks: Vec<Stock> = serde_json::from_str(&stocks_text)
        .map_err(|e| JsValue::from_str(&format!("JSON parse error: {}", e)))?;

    let mut result: Vec<EnrichedStock> = Vec::new();

    if let Some(query) = asset {
        let q = query.to_lowercase();
        for stock in stocks.iter() {
            if stock.name.to_lowercase().contains(&q) || stock.symbol.to_lowercase().contains(&q) {
                let symbol = stock.symbol.clone();

                let csv_path = format!("data/{}/{}.csv", market, symbol);
                let csv_url = format!(
                    "https://financial-data-omega.vercel.app/{}/{}.csv",
                    market, symbol
                );
                let csv_text = fetch_or_cache(&csv_path, &csv_url, ttl_24h)
                    .await
                    .unwrap_or_else(|_| "".to_string());

                let mut dates: Vec<String> = Vec::new();
                let mut close_prices: Vec<f64> = Vec::new();
                let mut daily_change: Vec<f64> = Vec::new();

                let lines: Vec<&str> = csv_text.trim().split('\n').collect();

                for line in lines.iter().skip(1) {
                    let cols: Vec<&str> = line.split(',').collect();
                    if cols.len() >= 6 {
                        dates.push(cols[0].to_string());
                        close_prices.push(cols[5].parse().unwrap_or(0.0));
                    }
                }

                for i in 1..close_prices.len() {
                    let prev = close_prices[i - 1];
                    let curr = close_prices[i];
                    daily_change.push(if prev != 0.0 { (curr - prev) / prev } else { 0.0 });
                }

                let mut symbol_clean = symbol.clone();
                if let Some(pos) = symbol.rfind('.') {
                    symbol_clean = symbol[..pos].to_string();
                }

                result.push(EnrichedStock {
                    name: stock.name.clone(),
                    symbol: symbol_clean,
                    dates,
                    closePrices: close_prices,
                    dailyChange: daily_change,
                    market: stock.market.clone().or(Some(market.clone())),
                    image: stock.image.clone(),
                });
            }
        }
    } else {
        for stock in stocks.iter() {
            result.push(EnrichedStock {
                name: stock.name.clone(),
                symbol: stock.symbol.clone(),
                dates: vec![],
                closePrices: vec![],
                dailyChange: vec![],
                market: stock.market.clone().or(Some(market.clone())),
                image: stock.image.clone(),
            });
        }
    }

    Ok(serde_wasm_bindgen::to_value(&result)?)
}
