package com.glucotwin.service;

import com.glucotwin.entity.User;
import com.glucotwin.exception.BusinessException;
import com.glucotwin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    /**
     * Updates the display name of the user identified by email.
     *
     * @param email   the authenticated user's email (from JWT principal)
     * @param newName the new display name to set (must be non-blank)
     * @return the saved User entity
     */
    @Transactional
    public User updateName(String email, String newName) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found", HttpStatus.NOT_FOUND));
        if (newName != null && !newName.isBlank()) {
            user.setName(newName.trim());
        }
        User saved = userRepository.save(user);
        log.info("Profile updated for user: {}", email);
        return saved;
    }
}
