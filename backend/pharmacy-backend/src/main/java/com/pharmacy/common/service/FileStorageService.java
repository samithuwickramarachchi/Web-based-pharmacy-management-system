package com.pharmacy.common.service;

import com.pharmacy.common.exception.BusinessException;
import com.pharmacy.common.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.Locale;
import java.util.UUID;

@Service
public class FileStorageService {

    public static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    private final Path uploadRoot;

    public FileStorageService(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(uploadRoot.resolve("prescriptions"));
            Files.createDirectories(uploadRoot.resolve("slips"));
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload directories", e);
        }
    }

    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Uploaded file cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException("File size exceeds maximum allowed size of 5 MB");
        }

        String rawFilename = file.getOriginalFilename();
        if (rawFilename == null || rawFilename.isBlank()) {
            throw new BusinessException("Uploaded file must have a valid filename");
        }

        // Prevent path traversal in raw filename
        if (rawFilename.contains("..") || rawFilename.contains("/") || rawFilename.contains("\\") || rawFilename.contains("\0")) {
            throw new BusinessException("Filename contains invalid or path traversal characters");
        }

        String extension = getFileExtension(rawFilename).toLowerCase(Locale.ROOT);
        if (!Arrays.asList("pdf", "jpg", "jpeg", "png").contains(extension)) {
            throw new BusinessException("Unsupported file type: ." + extension + ". Only PDF, JPG, and PNG files are accepted");
        }

        // Validate MIME type
        String contentType = file.getContentType();
        if (contentType != null) {
            String mime = contentType.toLowerCase(Locale.ROOT);
            if (extension.equals("pdf") && !mime.contains("pdf")) {
                throw new BusinessException("Invalid MIME type for PDF file: " + contentType);
            }
            if ((extension.equals("jpg") || extension.equals("jpeg")) && !mime.contains("jpeg") && !mime.contains("jpg")) {
                throw new BusinessException("Invalid MIME type for JPEG file: " + contentType);
            }
            if (extension.equals("png") && !mime.contains("png")) {
                throw new BusinessException("Invalid MIME type for PNG file: " + contentType);
            }
        }

        // Validate magic bytes
        validateMagicBytes(file, extension);
    }

    private void validateMagicBytes(MultipartFile file, String extension) {
        try (InputStream is = new BufferedInputStream(file.getInputStream())) {
            byte[] header = new byte[8];
            int read = is.read(header);
            if (read < 4) {
                throw new BusinessException("Invalid file content: file is too small");
            }

            if ("pdf".equals(extension)) {
                // PDF magic bytes: %PDF (0x25, 0x50, 0x44, 0x46)
                if (header[0] != 0x25 || header[1] != 0x50 || header[2] != 0x44 || header[3] != 0x46) {
                    throw new BusinessException("File content does not match PDF format");
                }
            } else if ("png".equals(extension)) {
                // PNG magic bytes: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
                if ((header[0] & 0xFF) != 0x89 || header[1] != 0x50 || header[2] != 0x4E || header[3] != 0x47) {
                    throw new BusinessException("File content does not match PNG format");
                }
            } else if ("jpg".equals(extension) || "jpeg".equals(extension)) {
                // JPEG magic bytes: 0xFF, 0xD8, 0xFF
                if ((header[0] & 0xFF) != 0xFF || (header[1] & 0xFF) != 0xD8 || (header[2] & 0xFF) != 0xFF) {
                    throw new BusinessException("File content does not match JPEG format");
                }
            }
        } catch (IOException e) {
            throw new BusinessException("Failed to read file content for validation: " + e.getMessage());
        }
    }

    public String storeFile(MultipartFile file, String subDirectory) {
        validateFile(file);

        try {
            Path targetDir = uploadRoot.resolve(subDirectory).normalize();
            if (!targetDir.startsWith(uploadRoot)) {
                throw new BusinessException("Invalid storage subdirectory");
            }
            Files.createDirectories(targetDir);

            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String extension = getFileExtension(originalFilename);
            String baseName = getBaseName(originalFilename).replaceAll("[^a-zA-Z0-9_.-]", "_");
            if (baseName.length() > 50) {
                baseName = baseName.substring(0, 50);
            }

            String uniqueFilename = UUID.randomUUID().toString().replace("-", "") + "_" + baseName + "." + extension;
            Path destination = targetDir.resolve(uniqueFilename).normalize();

            if (!destination.startsWith(targetDir)) {
                throw new BusinessException("Path traversal attempt detected");
            }

            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            // Return relative path: e.g. "prescriptions/uuid_name.pdf"
            return subDirectory + "/" + uniqueFilename;
        } catch (IOException e) {
            throw new BusinessException("Failed to store file: " + e.getMessage());
        }
    }

    public Resource loadFileAsResource(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) {
            throw new BusinessException("File path must not be empty");
        }

        // Normalize and guard against path traversal
        Path filePath = uploadRoot.resolve(relativePath).normalize();
        if (!filePath.startsWith(uploadRoot)) {
            throw new BusinessException("Path traversal attempt detected: invalid file path");
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found or unreadable at path: " + relativePath);
            }
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Malformed file path: " + relativePath);
        }
    }

    public MediaType determineMediaType(String filename) {
        if (filename == null) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".pdf")) {
            return MediaType.APPLICATION_PDF;
        } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG;
        } else if (lower.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        return MediaType.APPLICATION_OCTET_STREAM;
    }

    public String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }

    private String getBaseName(String filename) {
        if (filename == null) return "file";
        int dot = filename.lastIndexOf(".");
        return dot > 0 ? filename.substring(0, dot) : filename;
    }

    public Path getUploadRoot() {
        return uploadRoot;
    }
}
