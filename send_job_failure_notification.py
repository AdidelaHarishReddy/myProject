import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import datetime

def send_job_failure_notification(job_name, error_message, smtp_config):
    """
    Send an email notification when a job fails.
    
    Args:
        job_name (str): Name of the failed job
        error_message (str): Error message or description of failure
        smtp_config (dict): SMTP configuration details
    """
    # Email configuration
    sender_email = smtp_config['sender_email']
    recipient_email = smtp_config['recipient_email']
    smtp_server = smtp_config['smtp_server']
    smtp_port = smtp_config['smtp_port']
    smtp_username = smtp_config['smtp_username']
    smtp_password = smtp_config['smtp_password']
    
    # Create email message
    subject = f"Job Failure Alert: {job_name}"
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    body = f"""
    Job Failure Notification
    -----------------------
    Job Name: {job_name}
    Timestamp: {timestamp}
    Error Message: {error_message}
    
    Please investigate the issue and take appropriate action.
    """
    
    # Create MIME message
    message = MIMEMultipart()
    message['From'] = sender_email
    message['To'] = recipient_email
    message['Subject'] = subject
    message.attach(MIMEText(body, 'plain'))
    
    try:
        # Connect to SMTP server
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()  # Enable TLS
            server.login(smtp_username, smtp_password)
            server.send_message(message)
        print(f"Notification sent successfully for job: {job_name}")
    except Exception as e:
        print(f"Failed to send notification: {str(e)}")

# Example usage
if __name__ == "__main__":
    # SMTP configuration (example for Gmail)
    smtp_config = {
        'sender_email': 'your_email@gmail.com',
        'recipient_email': 'recipient@example.com',
        'smtp_server': 'smtp.gmail.com',
        'smtp_port': 587,
        'smtp_username': 'your_email@gmail.com',
        'smtp_password': 'your_app_specific_password'  # Use App Password for Gmail
    }
    
    # Example job failure
    try:
        # Simulate a job that might fail
        raise Exception("Database connection timeout")
    except Exception as e:
        send_job_failure_notification(
            job_name="Data Processing Job",
            error_message=str(e),
            smtp_config=smtp_config
        )