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
    // Cognito se temporary credentials obtain karo
    await new Promise((resolve, reject) => {
      AWS.config.credentials.get(error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    // Unique filename
    const fileKey = `${Date.now()}-${selectedFile.name}`;

    // S3 upload
    const params = {
      Bucket: INPUT_BUCKET,
      Key: fileKey,
      Body: selectedFile,
      ContentType: selectedFile.type
    };

    const result = await s3.upload(params).promise();

    console.log("Uploaded successfully:", result.Location);

    // Temporary testing:
    outputUrl = previewUrl;
    outputPreview.src = outputUrl;

    processing.classList.add("hidden");

  } catch (error) {
    console.error("Upload failed:", error);

    processing.classList.add("hidden");

    alert("Image upload failed. Please try again.");
  }
});

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
