import pandas as pd
import json

df = pd.read_csv('housing_sales_prices.csv')

# Filter to Intermediate Zones (or Council Areas for a lighter view)
subset = df[df['GeographyType'] == '2011 Intermediate Zones']

# Pivot measurements into columns
pivoted = subset.pivot_table(
    index=['GeographyCode', 'GeographyName', 'DateCode'],
    columns='Measurement',
    values='Value'
).reset_index()

# Calculate 5-year price change and 1-year price change
pivoted = pivoted.sort_values(['GeographyCode', 'DateCode'])
pivoted['PrevMean'] = pivoted.groupby('GeographyCode')['Mean'].shift(1)
pivoted['PctChange1Yr'] = ((pivoted['Mean'] - pivoted['PrevMean']) / pivoted['PrevMean']) * 100

# Save clean JSON
records = pivoted.dropna(subset=['Count', 'Mean']).to_dict(orient='records')
with open('housing_processed.json', 'w') as f:
    json.dump(records, f)
print(f"Exported {len(records)} records.")