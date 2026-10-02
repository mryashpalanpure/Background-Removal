# PureBG 

### Remove image backgrounds and get a clean white background in seconds : - 

PureBG is a web application that removes the background from an uploaded image and replaces it with a clean white background.

The project is built using AWS services and follows a serverless architecture.

---

## What is PureBG?

Normally, removing a background from an image requires an image-editing application.

PureBG makes this process simple:

1. Upload an image.
2. PureBG processes the image automatically.
3. The original background is removed.
4. A white background is added.
5. The final image is shown on the website.
6. The user can download the processed image.

---

##  How PureBG Works : - 

The complete process is:

User
  ↓
PureBG Website
  ↓
Upload Image
  ↓
Input S3 Bucket
  ↓
S3 triggers Lambda
  ↓
Lambda removes background
  ↓
White background is added
  ↓
Output S3 Bucket
  ↓
Processed image
  ↓
Shown on Website
  ↓
Download

Architecture : - 
                         ┌─────────────────┐
                         │      User       │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ PureBG Website  │
                         │ HTML/CSS/JS     │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │    Cognito      │
                         │ Temporary       │
                         │ Credentials    │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   Input S3      │
                         │     Bucket      │
                         └────────┬────────┘
                                  │
                           New Image Event
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  AWS Lambda     │
                         │     PureBg      │
                         │                 │
                         │ rembg + u2netp  │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  Output S3      │
                         │     Bucket      │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ Processed Image │
                         │   White BG      │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │      User       │
                         │ Preview/Download│
                         └─────────────────┘


              ┌─────────────────────────┐
              │       Amazon ECR        │
              │                         │
              │ Lambda Docker Image     │
              │ Python + rembg + u2netp │
              └────────────┬────────────┘
                           │
                           ▼
                     AWS Lambda


## Step-by-Step Working : - 

1. User Opens PureBG

The PureBG website is hosted as a static website using Amazon S3.

The user sees a simple interface where they can select or drag and drop an image.

2. User Uploads an Image

When the user selects an image, the website uploads it directly to the Input S3 Bucket.

Amazon Cognito provides temporary AWS credentials to the browser so that permanent AWS access keys are not stored in the website.

User
 ↓
Website
 ↓
Cognito
 ↓
Input S3 Bucket
3. S3 Detects the New Image

As soon as the image is uploaded, S3 detects that a new object has been created.

An S3 event automatically triggers the AWS Lambda function.

Input S3
   ↓
New Image
   ↓
S3 Event
   ↓
Lambda
4. Lambda Processes the Image

The Lambda function downloads the image from the Input S3 Bucket.

It then uses:

Python
rembg
u2netp
Pillow

to process the image.

The processing is:

Original Image
      ↓
Remove Background
      ↓
Transparent Image
      ↓
Add White Background
      ↓
Final PNG
5. Processed Image is Stored

After processing, Lambda uploads the final image to a separate Output S3 Bucket.

Input S3
   ↓
Lambda
   ↓
Output S3

The original image and processed image are therefore stored separately.

6. Website Shows the Result

The website waits for the processed image to become available in the Output S3 Bucket.

Once the image is ready, the website loads the processed image and displays it to the user.

The user can then download it.

Output S3
    ↓
Processed Image
    ↓
Website
    ↓
Preview
    ↓
Download

## Technologies Used : - 


## Frontend : - 
HTML
CSS
JavaScript
AWS SDK for JavaScript


## Backend : - 
Python
Pillow
rembg
u2netp


## AWS : - 
Amazon S3
AWS Lambda
Amazon ECR
Amazon Cognito
AWS IAM
Amazon CloudWatch


## Container : - 
Docker