package com.agrilink.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private static final List<String> ALLOWED_DOC_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/webp", "application/pdf"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    public String uploadImage(MultipartFile file, String folder) {
        validateFile(file, ALLOWED_IMAGE_TYPES);
        return upload(file, folder, "image");
    }

    public String uploadDocument(MultipartFile file, String folder) {
        validateFile(file, ALLOWED_DOC_TYPES);
        return upload(file, folder, "auto");
    }

    private String upload(MultipartFile file, String folder, String resourceType) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "agrilink/" + folder,
                            "resource_type", resourceType,
                            "transformation", "q_auto,f_auto"
                    ));
            return (String) result.get("secure_url");
        } catch (IOException e) {
            log.error("Cloudinary upload failed", e);
            throw new RuntimeException("Image upload failed. Please try again.");
        }
    }

    private void validateFile(MultipartFile file, List<String> allowedTypes) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds 10MB limit");
        }
        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new IllegalArgumentException("Invalid file type. Allowed: " + String.join(", ", allowedTypes));
        }
    }
}
