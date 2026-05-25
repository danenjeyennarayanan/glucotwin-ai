package com.glucotwin.controller;

import com.glucotwin.dto.ApiResponse;
import com.glucotwin.dto.UpdateProfileRequest;
import com.glucotwin.entity.User;
import com.glucotwin.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Tag(name = "User", description = "User profile management")
public class UserController {

    private final UserService userService;

    @PutMapping("/profile")
    @Operation(summary = "Update current user's display name",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<User>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest req,
            Authentication auth) {
        User saved = userService.updateName(auth.getName(), req.getName());
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", saved));
    }
}
