# Comprehensive Analysis Report Generation
# This module provides business-focused KPIs and chart generation

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
from datetime import datetime
import numpy as np

def detect_column_types(df):
    """Detect column types for business analysis."""
    columns = {
        'revenue': None,
        'units': None,
        'quantity': None,
        'price': None,
        'cost': None,
        'customer': None,
        'product': None,
        'category': None,
        'region': None,
        'date': None,
        'order_id': None
    }
    
    for col in df.columns:
        col_lower = col.lower().replace('_', '').replace(' ', '')
        
        # Revenue/Sales columns
        if any(word in col_lower for word in ['revenue', 'sales', 'totalamount', 'total']):
            if pd.api.types.is_numeric_dtype(df[col]):
                columns['revenue'] = col
        
        # Units/Quantity columns
        elif any(word in col_lower for word in ['units', 'quantity', 'qty', 'sold', 'volume']):
            if pd.api.types.is_numeric_dtype(df[col]):
                columns['units'] = col
        
        # Price columns
        elif any(word in col_lower for word in ['price', 'unitprice', 'cost', 'rate']):
            if pd.api.types.is_numeric_dtype(df[col]):
                columns['price'] = col
        
        # Customer columns
        elif any(word in col_lower for word in ['customer', 'client', 'buyer', 'name']):
            columns['customer'] = col
        
        # Product columns
        elif any(word in col_lower for word in ['product', 'item', 'sku']):
            columns['product'] = col
        
        # Category columns
        elif any(word in col_lower for word in ['category', 'type', 'segment', 'group']):
            columns['category'] = col
        
        # Region columns
        elif any(word in col_lower for word in ['region', 'country', 'state', 'city', 'area']):
            columns['region'] = col
        
        # Date columns
        elif any(word in col_lower for word in ['date', 'time', 'month', 'year', 'day']):
            columns['date'] = col
        
        # Order ID columns
        elif any(word in col_lower for word in ['orderid', 'ordernumber', 'id', 'transaction']):
            columns['order_id'] = col
    
    return columns

def calculate_business_kpis(df, col_map):
    """Calculate real business KPIs from the data."""
    kpis = []
    
    # Total Revenue
    if col_map['revenue']:
        total_revenue = df[col_map['revenue']].sum()
        kpis.append({
            "label": "Total Revenue",
            "value": f"${total_revenue:,.2f}",
            "icon": "dollar",
            "raw_value": float(total_revenue)
        })
    
    # Total Orders (count unique orders if available, else row count)
    if col_map['order_id']:
        total_orders = df[col_map['order_id']].nunique()
    else:
        total_orders = len(df)
    kpis.append({
        "label": "Total Orders",
        "value": f"{total_orders:,}",
        "icon": "hash",
        "raw_value": int(total_orders)
    })
    
    # Average Order Value
    if col_map['revenue'] and total_orders > 0:
        aov = df[col_map['revenue']].sum() / total_orders
        kpis.append({
            "label": "Average Order Value",
            "value": f"${aov:,.2f}",
            "icon": "chart",
            "raw_value": float(aov)
        })
    
    # Total Units Sold
    if col_map['units']:
        total_units = df[col_map['units']].sum()
        kpis.append({
            "label": "Total Units Sold",
            "value": f"{total_units:,.0f}",
            "icon": "hash",
            "raw_value": float(total_units)
        })
    
    # Growth Rate (if date column exists)
    if col_map['date'] and col_map['revenue']:
        try:
            df_temp = df.copy()
            df_temp[col_map['date']] = pd.to_datetime(df_temp[col_map['date']], errors='coerce')
            df_temp = df_temp.dropna(subset=[col_map['date']])
            
            if len(df_temp) > 1:
                df_temp = df_temp.sort_values(col_map['date'])
                first_period_revenue = df_temp[col_map['revenue']].iloc[:max(1, len(df_temp)//4)].sum()
                last_period_revenue = df_temp[col_map['revenue']].iloc[-max(1, len(df_temp)//4):].sum()
                
                if first_period_revenue > 0:
                    growth_rate = ((last_period_revenue - first_period_revenue) / first_period_revenue) * 100
                    kpis.append({
                        "label": "Growth Rate",
                        "value": f"{growth_rate:+.1f}%",
                        "icon": "chart",
                        "raw_value": float(growth_rate)
                    })
        except:
            pass
    
    # Peak Performance Period
    if col_map['date'] and col_map['revenue']:
        try:
            df_temp = df.copy()
            df_temp[col_map['date']] = pd.to_datetime(df_temp[col_map['date']], errors='coerce')
            df_temp['month'] = df_temp[col_map['date']].dt.to_period('M')
            monthly_revenue = df_temp.groupby('month')[col_map['revenue']].sum()
            
            if len(monthly_revenue) > 0:
                peak_month = monthly_revenue.idxmax()
                peak_value = monthly_revenue.max()
                kpis.append({
                    "label": f"Peak Month ({peak_month})",
                    "value": f"${peak_value:,.2f}",
                    "icon": "star",
                    "raw_value": float(peak_value)
                })
        except:
            pass
    
    return kpis

import numpy as np

def generate_business_charts(df, col_map):
    """Generate business-focused charts."""
    charts = []
    chart_configs = []
    
    # Chart 1: Revenue by Category
    if col_map['revenue'] and col_map['category']:
        try:
            revenue_by_cat = df.groupby(col_map['category'])[col_map['revenue']].sum().sort_values(ascending=False).head(10)
            # Convert to Python types to avoid numpy serialization issues
            x_values = [str(x) for x in revenue_by_cat.index.tolist()]
            y_values = [float(v) for v in revenue_by_cat.values.tolist()]
            fig = go.Figure()
            fig.add_trace(go.Bar(
                x=x_values,
                y=y_values,
                marker_color='#7C3AED',
                text=[f"${v:,.0f}" for v in y_values],
                textposition='outside'
            ))
            fig.update_layout(
                title="Total Revenue by Category",
                xaxis_title="Category",
                yaxis_title="Revenue ($)",
                template="plotly_white",
                showlegend=False,
                margin=dict(t=50, b=50, l=50, r=50),
                height=400
            )
            charts.append(fig.to_plotly_json())
            chart_configs.append({
                "title": "Revenue by Category",
                "description": f"Top {len(revenue_by_cat)} categories by total revenue",
                "chart_index": len(charts) - 1,
                "type": "bar"
            })
        except:
            pass
    
    # Chart 2: Units Sold by Category
    if col_map['units'] and col_map['category']:
        try:
            units_by_cat = df.groupby(col_map['category'])[col_map['units']].sum().sort_values(ascending=False).head(10)
            # Convert to Python types to avoid numpy serialization issues
            x_values = [str(x) for x in units_by_cat.index.tolist()]
            y_values = [float(v) for v in units_by_cat.values.tolist()]
            fig = go.Figure()
            fig.add_trace(go.Bar(
                x=x_values,
                y=y_values,
                marker_color='#7C3AED',
                text=[f"{v:,.0f}" for v in y_values],
                textposition='outside'
            ))
            fig.update_layout(
                title="Units Sold by Category",
                xaxis_title="Category",
                yaxis_title="Units Sold",
                template="plotly_white",
                showlegend=False,
                margin=dict(t=50, b=50, l=50, r=50),
                height=400
            )
            charts.append(fig.to_plotly_json())
            chart_configs.append({
                "title": "Units Sold by Category",
                "description": f"Top {len(units_by_cat)} categories by units sold",
                "chart_index": len(charts) - 1,
                "type": "bar"
            })
        except:
            pass
    
    # Chart 3: Average Order Value by Region
    if col_map['revenue'] and col_map['region'] and col_map['order_id']:
        try:
            aov_by_region = df.groupby(col_map['region']).agg({
                col_map['revenue']: 'sum',
                col_map['order_id']: 'nunique'
            })
            aov_by_region['aov'] = aov_by_region[col_map['revenue']] / aov_by_region[col_map['order_id']]
            aov_by_region = aov_by_region.sort_values('aov', ascending=False).head(10)
            
            # Convert to Python types
            x_values = [str(x) for x in aov_by_region.index.tolist()]
            y_values = [float(v) for v in aov_by_region['aov'].tolist()]
            
            fig = go.Figure()
            fig.add_trace(go.Bar(
                x=x_values,
                y=y_values,
                marker_color='#7C3AED',
                text=[f"${v:,.2f}" for v in y_values],
                textposition='outside'
            ))
            fig.update_layout(
                title="Average Order Value by Region",
                xaxis_title="Region",
                yaxis_title="AOV ($)",
                template="plotly_white",
                showlegend=False,
                margin=dict(t=50, b=50, l=50, r=50),
                height=400
            )
            charts.append(fig.to_plotly_json())
            chart_configs.append({
                "title": "Average Order Value by Region",
                "description": "AOV comparison across regions",
                "chart_index": len(charts) - 1,
                "type": "bar"
            })
        except:
            pass
    
    # Chart 4: Top 5 Customers by Revenue
    if col_map['revenue'] and col_map['customer']:
        try:
            top_customers = df.groupby(col_map['customer'])[col_map['revenue']].sum().sort_values(ascending=False).head(5)
            # Convert to Python types
            y_values = [str(x) for x in top_customers.index.tolist()[::-1]]
            x_values = [float(v) for v in top_customers.values.tolist()[::-1]]
            
            fig = go.Figure()
            fig.add_trace(go.Bar(
                y=y_values,
                x=x_values,
                orientation='h',
                marker_color='#7C3AED',
                text=[f"${v:,.0f}" for v in x_values],
                textposition='outside'
            ))
            fig.update_layout(
                title="Top 5 Customers by Revenue",
                xaxis_title="Revenue ($)",
                yaxis_title="Customer",
                template="plotly_white",
                showlegend=False,
                margin=dict(t=50, b=50, l=150, r=50),
                height=350
            )
            charts.append(fig.to_plotly_json())
            chart_configs.append({
                "title": "Top 5 Customers by Revenue",
                "description": "Highest revenue generating customers",
                "chart_index": len(charts) - 1,
                "type": "horizontal_bar"
            })
        except:
            pass
    
    # Chart 5: Revenue Trend Over Time
    if col_map['date'] and col_map['revenue']:
        try:
            df_temp = df.copy()
            df_temp[col_map['date']] = pd.to_datetime(df_temp[col_map['date']], errors='coerce')
            df_temp = df_temp.dropna(subset=[col_map['date']])
            
            if len(df_temp) > 0:
                df_temp['month'] = df_temp[col_map['date']].dt.to_period('M')
                monthly_revenue = df_temp.groupby('month')[col_map['revenue']].sum()
                
                # Convert to Python types
                x_values = [str(m) for m in monthly_revenue.index.tolist()]
                y_values = [float(v) for v in monthly_revenue.values.tolist()]
                
                fig = go.Figure()
                fig.add_trace(go.Scatter(
                    x=x_values,
                    y=y_values,
                    mode='lines+markers',
                    line=dict(color='#7C3AED', width=3),
                    marker=dict(size=8, color='#7C3AED'),
                    fill='tozeroy',
                    fillcolor='rgba(124, 58, 237, 0.1)'
                ))
                fig.update_layout(
                    title="Revenue Trend Over Time",
                    xaxis_title="Month",
                    yaxis_title="Revenue ($)",
                    template="plotly_white",
                    showlegend=False,
                    margin=dict(t=50, b=50, l=50, r=50),
                    height=400
                )
                charts.append(fig.to_plotly_json())
                chart_configs.append({
                    "title": "Revenue Trend",
                    "description": "Monthly revenue progression",
                    "chart_index": len(charts) - 1,
                    "type": "line"
                })
        except:
            pass
    
    return charts, chart_configs

def generate_enriched_summary(df, col_map, kpis):
    """Generate an enriched executive summary with specific calculated values."""
    summary_parts = []
    
    # Date range
    date_range = ""
    if col_map['date']:
        try:
            df_temp = df.copy()
            df_temp[col_map['date']] = pd.to_datetime(df_temp[col_map['date']], errors='coerce')
            df_temp = df_temp.dropna(subset=[col_map['date']])
            if len(df_temp) > 0:
                min_date = df_temp[col_map['date']].min()
                max_date = df_temp[col_map['date']].max()
                date_range = f"from {min_date.strftime('%B %Y')} to {max_date.strftime('%B %Y')}"
        except:
            pass
    
    # Revenue info
    revenue_info = ""
    if col_map['revenue']:
        total_rev = df[col_map['revenue']].sum()
        revenue_info = f"generating **${total_rev:,.2f}** in total revenue"
    
    # Order info
    order_info = ""
    if col_map['order_id']:
        total_orders = df[col_map['order_id']].nunique()
        order_info = f"across **{total_orders:,}** orders"
    elif len(df) > 0:
        order_info = f"across **{len(df):,}** transactions"
    
    # AOV info
    aov_info = ""
    if col_map['revenue']:
        total_orders = df[col_map['order_id']].nunique() if col_map['order_id'] else len(df)
        if total_orders > 0:
            aov = df[col_map['revenue']].sum() / total_orders
            aov_info = f"with an impressive average order value of **${aov:,.2f}**"
    
    # Build summary
    intro = f"This comprehensive sales analysis covers the period {date_range}. " if date_range else "This comprehensive sales analysis reveals key insights about your business performance. "
    
    performance = f"The business demonstrates strong performance, {revenue_info} {order_info}"
    if aov_info:
        performance += f", {aov_info}. "
    else:
        performance += ". "
    
    # Growth/trend info
    trend_info = ""
    if col_map['date'] and col_map['revenue']:
        try:
            df_temp = df.copy()
            df_temp[col_map['date']] = pd.to_datetime(df_temp[col_map['date']], errors='coerce')
            df_temp = df_temp.dropna(subset=[col_map['date']])
            
            if len(df_temp) > 1:
                df_temp = df_temp.sort_values(col_map['date'])
                first_rev = df_temp[col_map['revenue']].iloc[:max(1, len(df_temp)//4)].sum()
                last_rev = df_temp[col_map['revenue']].iloc[-max(1, len(df_temp)//4):].sum()
                
                if first_rev > 0:
                    growth = ((last_rev - first_rev) / first_rev) * 100
                    if growth > 0:
                        trend_info = f"Notably, the data shows a **{growth:.1f}% growth** trajectory between the initial and final periods analyzed, indicating positive momentum. "
                    elif growth < 0:
                        trend_info = f"The analysis reveals a **{abs(growth):.1f}% decline** between periods, suggesting areas for strategic improvement. "
        except:
            pass
    
    # Top performer info
    top_info = ""
    if col_map['category'] and col_map['revenue']:
        try:
            top_category = df.groupby(col_map['category'])[col_map['revenue']].sum().sort_values(ascending=False).index[0]
            top_revenue = df.groupby(col_map['category'])[col_map['revenue']].sum().sort_values(ascending=False).iloc[0]
            top_info = f"The **{top_category}** category emerges as the top performer, contributing significantly to overall revenue. "
        except:
            pass
    
    summary = intro + performance + trend_info + top_info
    summary += "Key recommendations include optimizing high-performing segments and addressing underperforming areas to maximize growth potential."
    
    return summary
