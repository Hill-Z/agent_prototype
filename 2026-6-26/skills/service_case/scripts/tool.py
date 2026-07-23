import uuid

REGISTERED_EMAIL = "sunlin@udesk.cn"
# Replace this value with the cloud-hosted PDF URL when available.
CONSUMPTION_REPORT_PDF_URL = "https://espreview.s4.udesk.cn/onlinePreview?url=RDZDQUNBQ0VDRDg0OTE5MURGRDJENzkzQ0Q4QjkzRDVEMzkzQ0VDQkRDOTNDRENBREE5MENCREFEQkNERDVERENEOTBEREQxRDM5MUZBREZDQURGOTE4RjhCOTE4OUQ4OEREQTg5REFERkQ4OTM4RThCODdERjkzOEE4OERCODc5Mzg2OEVEQzg2OTM4Qjg4RDg4ODhFREI4OUREOEE4NkREODg5MUVFREZEREQ3RDhEN0RERjJEN0Q5RDZDQUUxRkREMUQwQ0RDQkQzQ0VDQUQ3RDFEMEUxRUNEQkNFRDFDQ0NBRTFGRDkzRUVGMjkzOEM4RThFOEZFMThDOEU4Qzg4OTNFRjhDOTBDRURBRDg4MURERDFEMENBREJEMENBODM%3D"
CONSUMPTION_REPORT_DOWNLOAD_URL = "https://ali-s5-km-pub-std.udeskcs.com/Data/15/7f3d7daf-059a-46e9-80b8-56f60e7c48c6/PacificLight_Consumption_Report_C-PL-2001_2026-Q2.pdf"

CUSTOMERS = {
    "C-PL-2001": {
        "company": "ABC Manufacturing Pte Ltd",
        "account_no": "C-PL-2001",
        "postal_code": "609999",
        "registered_email": REGISTERED_EMAIL,
        "account_admin": "Ms Lim",
        "current_plan": "Commercial Fixed 24",
        "service_address": "Jurong Industrial Estate, Singapore 609999",
    },
    "R-PL-1001": {"name": "Tan Mei Ling", "account_no": "R-PL-1001", "registered_email": REGISTERED_EMAIL},
    "R-PL-1002": {"name": "Nur Aisyah Binte Rahman", "account_no": "R-PL-1002", "registered_email": REGISTERED_EMAIL},
}

REPORT_Q2_2026 = {
    "period": "2026-04 to 2026-06",
    "rows": [
        {"month": "Apr 2026", "consumption": "11,680 kWh", "peak_demand": "86 kW", "billed_amount": "SGD 3,198.42"},
        {"month": "May 2026", "consumption": "12,310 kWh", "peak_demand": "91 kW", "billed_amount": "SGD 3,370.99"},
        {"month": "Jun 2026", "consumption": "12,000 kWh", "peak_demand": "89 kW", "billed_amount": "SGD 3,288.86"},
    ],
    "total_consumption": "35,990 kWh",
    "average_monthly_consumption": "11,997 kWh",
    "total_billed_amount": "SGD 9,858.27",
}


def _is_en(language=""):
    return str(language or "").lower().startswith("en")


def _case_id(case_type="support"):
    return f"PL-{(case_type or 'support').upper()}-{uuid.uuid4().hex[:8].upper()}"


def _format_report_link(language="en"):
    if _is_en(language):
        return f"[Click here to view the consumption report]({CONSUMPTION_REPORT_PDF_URL})"
    return f"[点击此处查看用电报告]({CONSUMPTION_REPORT_PDF_URL})"


def create_case(title: str, description: str = "", account_no: str = "", case_type: str = "support", priority: str = "normal", language: str = "zh") -> str:
    """Create a PacificLight service case record."""
    en = _is_en(language)
    case_id = _case_id(case_type)
    if en:
        return (f"FINAL_ANSWER: I have recorded your request and submitted it to the relevant team for follow-up.\n\n"
                f"Case ID: {case_id}\nTitle: {title}\nAccount No.: {account_no or 'Not provided'}\n"
                f"Type: {case_type}\nPriority: {priority}\nDetails: {description or 'None'}\nStatus: Submitted")
    return (f"FINAL_ANSWER: 我已记录您的问题，并提交对应团队继续跟进。\n\n"
            f"Case ID：{case_id}\n标题：{title}\n账户号：{account_no or '未提供'}\n"
            f"类型：{case_type}\n优先级：{priority}\n说明：{description or '无'}\n状态：已提交")


def create_consumption_report_request(account_no: str = "", period: str = "", report_format: str = "both", send_to_registered_email: bool = True, additional_recipient: str = "", language: str = "zh") -> str:
    """Create a commercial consumption report request and return the report PDF link."""
    en = _is_en(language)
    c = CUSTOMERS.get((account_no or "").upper())
    if not c:
        return "FINAL_ANSWER: I could not find this account. Please check the account number and try again." if en else "FINAL_ANSWER: 未找到对应账户，请核对账户号后再试。"

    case_id = _case_id("REPORT")
    company = c.get("company") or c.get("name") or "PacificLight Customer"
    email = c.get("registered_email", REGISTERED_EMAIL)
    fmt = (report_format or "both").upper()
    if fmt in {"BOTH", "PDF+EXCEL", "PDF AND EXCEL"}:
        fmt_display = "PDF and Excel" if en else "PDF 和 Excel"
    elif fmt == "PDF":
        fmt_display = "PDF"
    elif fmt in {"EXCEL", "XLSX"}:
        fmt_display = "Excel"
    else:
        fmt_display = report_format or ("PDF and Excel" if en else "PDF 和 Excel")
    report_period = period or REPORT_Q2_2026["period"]
    report_link = _format_report_link(language)

    if additional_recipient:
        if en:
            return (f"FINAL_ANSWER: Done. I’ve created the consumption report request and the additional recipient approval request.\n\n"
                    f"Case ID: {case_id}\nAccount No.: {account_no}\nCustomer: {company}\nReport Period: {report_period}\n"
                    f"Report Format: {fmt_display}\nPrimary Delivery: Registered billing email {email}\n"
                    f"Report PDF: {report_link}\nAdditional Recipient: {additional_recipient}\n"
                    f"Status: The report request has been submitted. The additional recipient requires account administrator approval before reports are sent there.")
        return (f"FINAL_ANSWER: 已创建用电报告请求，并已提交新增收件人审批。\n\n"
                f"Case ID：{case_id}\n账户号：{account_no}\n客户：{company}\n报告周期：{report_period}\n"
                f"报告格式：{fmt_display}\n主要发送方式：账户登记账单邮箱 {email}\n"
                f"报告 PDF：{report_link}\n新增收件人：{additional_recipient}\n"
                f"状态：报告请求已提交。新增收件人需账户管理员审批后，报告才会发送至该邮箱。")

    if en:
        return (f"FINAL_ANSWER: Done. I’ve created the consumption report request.\n\n"
                f"Case ID: {case_id}\nAccount No.: {account_no}\nCustomer: {company}\nReport Period: {report_period}\n"
                f"Report Format: {fmt_display}\nDelivery: Registered billing email {email}\nReport PDF: {report_link}\n"
                f"Status: Submitted. The request will also be recorded in the customer interaction history.")
    return (f"FINAL_ANSWER: 已创建用电报告请求。\n\n"
            f"Case ID：{case_id}\n账户号：{account_no}\n客户：{company}\n报告周期：{report_period}\n报告格式：{fmt_display}\n"
            f"发送方式：账户登记账单邮箱 {email}\n报告 PDF：{report_link}\n"
            f"状态：已提交。本次请求也会记录在客户交互历史中。")


def prepare_consumption_report_email(account_no: str = "C-PL-2001", period: str = "2026-04 to 2026-06", report_format: str = "both", language: str = "zh") -> str:
    """Prepare subject and HTML body for a commercial consumption report email."""
    en = _is_en(language)
    c = CUSTOMERS.get((account_no or "").upper(), CUSTOMERS["C-PL-2001"])
    company = c.get("company") or c.get("name") or "PacificLight Customer"
    email = c.get("registered_email", REGISTERED_EMAIL)
    period = period or REPORT_Q2_2026["period"]
    rows_html = "".join(
        f"<tr><td style='padding:8px 10px;border:1px solid #e5e7eb'>{r['month']}</td>"
        f"<td style='padding:8px 10px;border:1px solid #e5e7eb;text-align:right'>{r['consumption']}</td>"
        f"<td style='padding:8px 10px;border:1px solid #e5e7eb;text-align:right'>{r['peak_demand']}</td>"
        f"<td style='padding:8px 10px;border:1px solid #e5e7eb;text-align:right'>{r['billed_amount']}</td></tr>"
        for r in REPORT_Q2_2026['rows']
    )
    if en:
        subject = f"PacificLight Consumption Report {account_no} - {period}"
        body = f"""
<div style='font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#111827'>
  <p>Dear Customer,</p>
  <p>Here is the requested PacificLight electricity consumption report for <strong>{company}</strong>.</p>
  <table style='border-collapse:collapse;margin:12px 0;max-width:860px'>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Account No.</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{account_no}</td></tr>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Service Address</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{c.get('service_address', '')}</td></tr>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Report Period</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{period}</td></tr>
  </table>
  <table style='border-collapse:collapse;margin:12px 0;max-width:860px'>
    <tr><th style='padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Month</th><th style='padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Consumption</th><th style='padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Peak Demand</th><th style='padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Billed Amount</th></tr>
    {rows_html}
  </table>
  <p><strong>Total Consumption:</strong> {REPORT_Q2_2026['total_consumption']}<br>
  <strong>Average Monthly Consumption:</strong> {REPORT_Q2_2026['average_monthly_consumption']}<br>
  <strong>Total Billed Amount:</strong> {REPORT_Q2_2026['total_billed_amount']}</p>
  <p>Report PDF: <a href='{CONSUMPTION_REPORT_PDF_URL}' target='_blank' rel='noopener noreferrer'>Click here to view the consumption report</a></p>
  <p>This report may be used for internal finance and ESG reporting reference.</p>
  <p>Best regards,<br><strong>PacificLight Customer Service</strong><br>PacificLight Energy</p>
</div>
""".strip()
        return f"SUBJECT: {subject}\nRECIPIENT: {email}\nREPORT_PDF_URL: {CONSUMPTION_REPORT_PDF_URL}\nEMAIL_HTML:\n{body}"

    subject = f"PacificLight 用电报告 {account_no} - {period}"
    body = f"""
<div style='font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#111827'>
  <p>尊敬的客户，</p>
  <p>以下是 <strong>{company}</strong> 申请的 PacificLight 用电报告。</p>
  <table style='border-collapse:collapse;margin:12px 0;max-width:860px'>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>账户号</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{account_no}</td></tr>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>服务地址</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{c.get('service_address', '')}</td></tr>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>报告周期</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{period}</td></tr>
  </table>
  <table style='border-collapse:collapse;margin:12px 0;max-width:860px'>
    <tr><th style='padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>月份</th><th style='padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>用电量</th><th style='padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>峰值负荷</th><th style='padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>账单金额</th></tr>
    {rows_html}
  </table>
  <p><strong>总用电量：</strong>{REPORT_Q2_2026['total_consumption']}<br>
  <strong>月均用电量：</strong>{REPORT_Q2_2026['average_monthly_consumption']}<br>
  <strong>账单总额：</strong>{REPORT_Q2_2026['total_billed_amount']}</p>
  <p>报告 PDF：<a href='{CONSUMPTION_REPORT_PDF_URL}' target='_blank' rel='noopener noreferrer'>点击此处查看用电报告</a></p>
  <p>该报告可用于内部财务和 ESG 汇报参考。</p>
  <p>此致，<br><strong>PacificLight Customer Service</strong><br>PacificLight Energy</p>
</div>
""".strip()
    return f"SUBJECT: {subject}\nRECIPIENT: {email}\nREPORT_PDF_URL: {CONSUMPTION_REPORT_PDF_URL}\nEMAIL_HTML:\n{body}"
