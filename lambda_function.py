import boto3
import urllib.parse
import os
from io import BytesIO

s3 = boto3.client("s3")

OUTPUT_BUCKET = "output-images-palanpure"

session = None


def lambda_handler(event, context):

    global session

    from PIL import Image
    from rembg import remove, new_session

    # Load model only once per warm Lambda container
    if session is None:
        print("Loading u2netp model...")
        session = new_session("u2netp")
        print("u2netp model loaded")

    for record in event["Records"]:

        input_bucket = record["s3"]["bucket"]["name"]

        input_key = urllib.parse.unquote_plus(
            record["s3"]["object"]["key"]
        )

        print(f"Processing: s3://{input_bucket}/{input_key}")

        response = s3.get_object(
            Bucket=input_bucket,
            Key=input_key
        )

        input_bytes = response["Body"].read()

        # Remove background using lightweight u2netp
        output_bytes = remove(
            input_bytes,
            session=session
        )

        foreground = Image.open(
            BytesIO(output_bytes)
        ).convert("RGBA")

        white_background = Image.new(
            "RGBA",
            foreground.size,
            (255, 255, 255, 255)
        )

        final_image = Image.alpha_composite(
            white_background,
            foreground
        ).convert("RGB")

        output_buffer = BytesIO()

        final_image.save(
            output_buffer,
            format="PNG"
        )

        output_buffer.seek(0)

        output_key = os.path.splitext(input_key)[0] + ".png"

        s3.put_object(
            Bucket=OUTPUT_BUCKET,
            Key=output_key,
            Body=output_buffer.getvalue(),
            ContentType="image/png"
        )

        print(
            f"Successfully created: "
            f"s3://{OUTPUT_BUCKET}/{output_key}"
        )

    return {
        "statusCode": 200,
        "message": "Image processed successfully"
    }