package com.agrilink.dto.request;

import lombok.Data;

@Data
public class GoogleAuthRequest {
    private String credential; // Google ID token
}
