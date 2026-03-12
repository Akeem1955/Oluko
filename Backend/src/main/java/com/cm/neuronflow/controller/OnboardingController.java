package com.cm.neuronflow.controller;


import com.cm.neuronflow.internal.domain.Users;
import com.cm.neuronflow.internal.dto.*;
import com.cm.neuronflow.services.OnboardingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${api.base}")
@Slf4j
public class OnboardingController {
    private final OnboardingService onboardingService;

    OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }


    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody SignupRequest signupRequest){
        log.info("Signup request for email: {}", signupRequest.getEmail());
        onboardingService.sendOtpAndCacheUser(signupRequest);
        return ResponseEntity.ok("Otp Sent Successfully");
    }


    @PostMapping("/verify-signup")
    public ResponseEntity<String> verifySignup(@RequestParam String otp, @RequestParam String email){
        String token = onboardingService.confirmOtpAndSaveUser(otp, email);
        return ResponseEntity.ok(token);
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest loginRequest) {
        onboardingService.initiateLogin(loginRequest);
        return ResponseEntity.ok("Otp Sent Successfully");
    }
    @PostMapping("/verify-login")
    public ResponseEntity<String> verifyLogin(@RequestParam String otp, @RequestParam String email) {
        String token =onboardingService.verifyOtpAndAuthenticate(otp, email);
        return ResponseEntity.ok(token);
    }

    @PostMapping("/resetPassword")
    public ResponseEntity<String> resetPassword(@RequestBody PasswordResetRequest resetRequest) {
        onboardingService.initiatePasswordReset(resetRequest);
        return ResponseEntity.ok("Otp Sent Successfully");
    }
    @PostMapping("/verify-resetPassword")
    public ResponseEntity<String> verifyResetPassword(@RequestParam String otp, @RequestParam String email, @RequestParam String newPassword) {
        onboardingService.verifyOtpAndResetPassword(otp,newPassword,email);
        return ResponseEntity.ok("Password Reset Successfully");
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> me(
            @AuthenticationPrincipal UserDetails principal
    ) {
        UserDTO response = onboardingService.me(principal.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/me")
    public ResponseEntity<String> updateProfile(@RequestBody ProfileUpdateDTO updates) {
        org.springframework.security.core.Authentication authentication = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String email = null;
        Object principal = authentication.getPrincipal();
        if (principal instanceof Users) {
            email = ((Users) principal).getEmail();
        } else if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            email = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
        }

        if (email == null) return ResponseEntity.status(401).build();

        onboardingService.updateUserProfile(email, updates.getBase64Image(), updates.getWeeklyGoalHours());
        return ResponseEntity.ok("Profile Updated Successfully");
    }

}
