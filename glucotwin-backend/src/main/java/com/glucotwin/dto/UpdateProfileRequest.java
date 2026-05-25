package com.glucotwin.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @Size(min = 2, max = 120, message = "Name must be between 2 and 120 characters")
    private String name;
}
