const fileInput = document.getElementById("fileInput");
const uploadArea = document.getElementById("uploadArea");
const chooseBtn = document.getElementById("chooseBtn");
const selectedPanel = document.getElementById("selectedPanel");
const resultPanel = document.getElementById("resultPanel");
const inputPreview = document.getElementById("inputPreview");
const outputPreview = document.getElementById("outputPreview");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const processBtn = document.getElementById("processBtn");
const clearBtn = document.getElementById("clearBtn");
const againBtn = document.getElementById("againBtn");
const downloadBtn = document.getElementById("downloadBtn");
const processing = document.getElementById("processing");

let selectedFile = null;
let previewUrl = null;
let outputUrl = null;

const AWS_REGION = "us-east-1";

const IDENTITY_POOL_ID = "us-east-1:affe26ca-122b-4392-a499-64c76023fbdb";

const INPUT_BUCKET = "input-images-palanpure";

AWS.config.update({
  region: AWS_REGION,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IDENTITY_POOL_ID
  })
});

const s3 = new AWS.S3();

chooseBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  fileInput.click();
});

uploadArea.addEventListener("click", () => fileInput.click());

["dragenter", "dragover"].forEach(eventName => {
  uploadArea.addEventListener(eventName, e => {
    e.preventDefault();
    uploadArea.style.borderColor = "#6b5cf6";
    uploadArea.style.background = "rgba(247,245,255,.95)";
  });
});

["dragleave", "drop"].forEach(eventName => {
  uploadArea.addEventListener(eventName, e => {
    e.preventDefault();
    uploadArea.style.borderColor = "";
    uploadArea.style.background = "";
  });
});

uploadArea.addEventListener("drop", e => {
  const file = e.dataTransfer.files[0];
  if (file) loadFile(file);
});

fileInput.addEventListener("change", e => {
  if (e.target.files[0]) loadFile(e.target.files[0]);
});

function loadFile(file) {
  if (!file.type.startsWith("image/")) {
    alert("Please choose an image.");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert("Please choose an image smaller than 10 MB.");
    return;
  }

  selectedFile = file;

  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);

  inputPreview.src = previewUrl;
  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);

  uploadArea.classList.add("hidden");
  resultPanel.classList.add("hidden");
  selectedPanel.classList.remove("hidden");
}

processBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  selectedPanel.classList.add("hidden");
  resultPanel.classList.remove("hidden");
  processing.classList.remove("hidden");

  try {
    // Get temporary Cognito credentials
    await new Promise((resolve, reject) => {
      AWS.config.credentials.get(error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    // Unique input filename
    const fileKey = `${Date.now()}-${selectedFile.name}`;

    // Upload to input bucket
    const params = {
      Bucket: INPUT_BUCKET,
      Key: fileKey,
      Body: selectedFile,
      ContentType: selectedFile.type
    };

    await s3.upload(params).promise();

    console.log("Upload successful:", fileKey);

    // Lambda output filename
    const outputKey =
      fileKey.substring(0, fileKey.lastIndexOf(".")) + ".png";

    console.log("Waiting for output:", outputKey);

    // Wait for Lambda to process image
    await waitForOutput(outputKey);

    // Get processed image from output bucket
    const outputParams = {
      Bucket: "output-images-palanpure",
      Key: outputKey
    };

    const outputData = await s3.getObject(outputParams).promise();

    // Convert S3 image bytes into browser image
    const blob = new Blob(
      [outputData.Body],
      { type: "image/png" }
    );

    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
    }

    outputUrl = URL.createObjectURL(blob);

    outputPreview.src = outputUrl;

    processing.classList.add("hidden");

    console.log("Processed image displayed successfully.");

  } catch (error) {

    console.error("Processing failed:", error);

    processing.classList.add("hidden");

    alert(
      "Something went wrong while processing the image. Please try again."
    );
  }
});

async function waitForOutput(outputKey) {

  const maxAttempts = 60;
  const delay = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {

    try {

      await s3.headObject({
        Bucket: "output-images-palanpure",
        Key: outputKey
      }).promise();

      console.log(
        `Output found after ${attempt} attempt(s).`
      );

      return;

    } catch (error) {

      if (
        error.code !== "NotFound" &&
        error.statusCode !== 404
      ) {
        throw error;
      }

      console.log(
        `Waiting for Lambda... attempt ${attempt}/${maxAttempts}`
      );

      await new Promise(resolve =>
        setTimeout(resolve, delay)
      );
    }
  }

  throw new Error("Processing timeout.");
}

downloadBtn.addEventListener("click", () => {
  if (!outputUrl) return;
  const link = document.createElement("a");
  link.href = outputUrl;
  link.download = "purebg-photo.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
});

clearBtn.addEventListener("click", reset);
againBtn.addEventListener("click", reset);

function reset() {
  selectedFile = null;
  fileInput.value = "";

  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  outputUrl = null;

  selectedPanel.classList.add("hidden");
  resultPanel.classList.add("hidden");
  processing.classList.add("hidden");
  uploadArea.classList.remove("hidden");
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
