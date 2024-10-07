import React, { useState, useRef } from "react";
import axios from "axios";
import "../FileUploader.css";
import { FiX } from "react-icons/fi";
import { MdDelete } from "react-icons/md";
import { FaFile, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileCsv, FaVideo } from 'react-icons/fa';

const FileUploader = () => {
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState({});
  const [fileSizes, setFileSizes] = useState({}); // Store file size display
  const [completed, setCompleted] = useState({});
  const cancelTokens = useRef({}); // Store cancel tokens for each file

  const getFileIcon = (extension) => {
    switch (extension) {
      case 'pdf':
        return <FaFilePdf />;
      case 'doc':
      case 'docx':
        return <FaFileWord />;
      case 'xls':
      case 'xlsx':
        return <FaFileExcel />;
      case 'csv':
        return <FaFileCsv />; // Icon for CSV files
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <FaFileImage />; // Icon for image files
      case 'mp4':
      case 'avi':
      case 'mkv':
      case 'mov':
        return <FaVideo />; // Icon for video files
      default:
        return <FaFile />; // Generic file icon
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files); // Make sure multiple files are selected
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]); // Append new files to the current state
    uploadFiles(selectedFiles); // Upload all selected files
  };

  const uploadFiles = (fileList) => {
    fileList.forEach((file) => {
      const fileName =
        file.name.length >= 12
          ? file.name.substring(0, 13) + "... ." + file.name.split(".").pop()
          : file.name;

      // Prepare the form data for upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "secure_upload"); // Use your unsigned preset here
      formData.append("cloud_name", "dizl3cgfi"); // Replace with your Cloudinary cloud name

      const cancelToken = axios.CancelToken.source(); // Create a cancel token for each file
      cancelTokens.current[file.name] = cancelToken; // Store it using the file name as the key

      axios
        .post("https://api.cloudinary.com/v1_1/dizl3cgfi/upload", formData, {
          cancelToken: cancelToken.token, // Attach the cancel token
          onUploadProgress: (event) => {
            const percentage = Math.floor((event.loaded / event.total) * 100);

            // Calculate file size in KB or MB
            const formattedFileSize = event.total >= 1024 * 1024
              ? `${(event.loaded / (1024 * 1024)).toFixed(2)} MB / ${(event.total / (1024 * 1024)).toFixed(2)} MB`
              : `${(event.loaded / 1024).toFixed(2)} KB / ${(event.total / 1024).toFixed(2)} KB`;

            // Update progress and file size display
            setProgress((prev) => ({ ...prev, [file.name]: percentage }));
            setFileSizes((prev) => ({ ...prev, [file.name]: formattedFileSize }));
          },
        })
        .then((response) => {
          console.log("File uploaded successfully:", response.data);
          setCompleted((prev) => ({ ...prev, [file.name]: true }));
        })
        .catch((error) => {
          if (axios.isCancel(error)) {
            console.log("Upload canceled", file.name);
          } else {
            console.error("Error uploading file to Cloudinary", error);
          }
        });
    });
  };

  // Function to cancel an ongoing file upload
  const cancelUpload = (fileName) => {
    if (completed[fileName]) {
      console.log(`Cannot cancel ${fileName}, upload is already completed.`);
      return; // Do not allow canceling if the file is fully uploaded
    }

    if (cancelTokens.current[fileName]) {
      cancelTokens.current[fileName].cancel("Upload canceled by user");
      setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName)); // Remove the file from the state
      setProgress((prevProgress) => {
        const newProgress = { ...prevProgress };
        delete newProgress[fileName];
        return newProgress;
      });
      setCompleted((prevCompleted) => {
        const newCompleted = { ...prevCompleted };
        delete newCompleted[fileName];
        return newCompleted;
      });
      delete cancelTokens.current[fileName]; // Remove the cancel token
    }
  };

  return (
    <div className="file-uploader">
      <div className="uploader-header">
        <h2 className="uploader-title">File Uploader</h2>
        <h4 className="file-completed-status">
          {Object.keys(completed).length} files uploaded
        </h4>
      </div>
      <ul className="file-list">
        {files.map((file, index) => (
          <li key={index} className="file-item">
<div className="file-extension">{getFileIcon(file.name.split(".").pop())}</div>
            <div className="file-content-wrapper">
              <div className="file-content" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="file-details">
                  <span className="file-name">{file.name}</span>
                  <span
                    className="file-info"
                    style={{ color: completed[file.name] ? "green" : "blue" }} // Conditional coloring
                  >
                    <small>{fileSizes[file.name]}</small> {/* Display the file size */}
                    {completed[file.name] ? "Uploaded" : "Uploading"}
                    <small>{progress[file.name] || 0}%</small>
                  </span>
                </div>
                <div className="file-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {!completed[file.name] && ( // Only show "Cancel" button while uploading
                    <button className="cancel-button" onClick={() => cancelUpload(file.name)}>
                      <FiX />
                    </button>
                  )}
                  {completed[file.name] && ( // Show delete button only when upload is complete
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(file.name)}
                    >
                      <MdDelete />
                    </button>
                  )}
                </div>
              </div>
              <div className="file-progress-bar">
                <div
                  className="file-progress"
                  style={{ width: `${progress[file.name] || 0}%` }}
                ></div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="file-upload-box">
        <h2 className="box-title">
          <span className="file-instruction">Drag files here or </span>
          <span
            className="file-browse-button"
            onClick={() => document.querySelector(".file-browse-input").click()}
          >
            browse
          </span>
        </h2>
        <input
          className="file-browse-input"
          type="file"
          multiple
          hidden
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default FileUploader;
