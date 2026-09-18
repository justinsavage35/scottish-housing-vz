import pandas as pd

df = pd.read_csv("../data/housing_sales_prices.csv")

df_inter_code = pd.read_csv("../data/intermeditate_code.csv")

df_geography_type = df[df["GeographyType"] == "2011 Intermediate Zones"]

df_merge = pd.merge(df_geography_type, df_inter_code, left_on='GeographyCode', right_on='IntZone', how='outer')

pivoted = df_merge.pivot_table(
    index=['GeographyCode', 'GeographyName', 'DateCode', 'HSCPName'],
    columns='Measurement',
    values='Value'
).reset_index()


# Calculate 1-year price change
pivoted = pivoted.sort_values(['GeographyCode', 'DateCode'])
pivoted['PrevMean'] = pivoted.groupby('GeographyCode')['Mean'].shift(1)
pivoted['PctChange1Yr'] = ((pivoted['Mean'] - pivoted['PrevMean']) / pivoted['PrevMean']) * 100

# Drop entries missing essential sales count or mean price
pivoted = pivoted.dropna(subset=['Count', 'Mean'])

# Replace all remaining NaNs (e.g. from the first year's shift) with None/null
pivoted = pivoted.where(pd.notnull(pivoted), None)

# Export using pandas to_json to guarantee valid JSON nulls
pivoted.to_json('../public/housing_processed.json', orient='records', indent=2)
print("Successfully generated public/housing_processed.json with valid JSON nulls.")