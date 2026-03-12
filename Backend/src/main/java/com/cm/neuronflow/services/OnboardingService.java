package com.cm.neuronflow.services;


import com.cm.neuronflow.config.security.auth.JwtManager;
import com.cm.neuronflow.internal.domain.Users;
import com.cm.neuronflow.internal.dto.*;
import com.cm.neuronflow.internal.events.SendOtpEvent;
import com.cm.neuronflow.internal.exceptions.InvalidUserException;
import com.cm.neuronflow.internal.exceptions.OtpInvalidException;
import com.cm.neuronflow.internal.exceptions.UserAlreadyExistsException;
import com.cm.neuronflow.internal.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Optional;

@Service
@Slf4j
public class OnboardingService {
    private final RedisTemplate<String, Users> redisTemplate;
    private final OtpServices otpServices;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtManager  jwtManager;
    private final ApplicationEventPublisher eventPublisher;

    @Autowired
    OnboardingService(RedisTemplate<String, Users> redisTemplate,
                      OtpServices otpServices,
                      ApplicationEventPublisher eventPublisher,
                      UserRepository userRepository,
                      PasswordEncoder passwordEncoder,JwtManager jwtManager) {
        this.redisTemplate = redisTemplate;
        this.otpServices = otpServices;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.eventPublisher=eventPublisher;
        this.jwtManager = jwtManager;
    }

    public void sendOtpAndCacheUser(SignupRequest signupRequest){
        if (userRepository.findByEmail(signupRequest.getEmail()).isPresent()) {
            throw new UserAlreadyExistsException("User with email " + signupRequest.getEmail() + " already exists");
        }
        Users user = Users.builder()
                .email(signupRequest.getEmail())
                .password(signupRequest.getPassword())
                .fullName(signupRequest.getFullName())
                .build();
        eventPublisher.publishEvent(new SendOtpEvent(user));
        String otp = otpServices.sendEmailOtp(user.getEmail());
        redisTemplate.opsForValue().set(otp,user, Duration.ofMinutes(5));
    }


    public String confirmOtpAndSaveUser(String otp,String email){
        Users user =redisTemplate.opsForValue().get(otp);
        if(user==null || !(user.getEmail().equalsIgnoreCase(email))){
            throw new OtpInvalidException();
        }
        log.info("Saving user: {}", user.getEmail());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        redisTemplate.delete(otp);
        return jwtManager.generateToken(user.getEmail());

    }
    public void initiateLogin(LoginRequest loginRequest){
       Optional<Users> dbUser = userRepository.findByEmail(loginRequest.getEmail());
       if(dbUser.isPresent()){
           if(passwordEncoder.matches(loginRequest.getPassword(), dbUser.get().getPassword())){
               String otp = otpServices.sendEmailOtp(dbUser.get().getEmail());
               Users tempUser = Users.builder()
                       .email(loginRequest.getEmail())
                       .password(loginRequest.getPassword())
                       .build();
               redisTemplate.opsForValue().set(otp,tempUser, Duration.ofMinutes(5));
               return;
           }
       }
       throw  new InvalidUserException();
    }

    public void initiatePasswordReset(PasswordResetRequest resetRequest) {
        Optional<Users> dbUser = userRepository.findByEmail(resetRequest.getEmail());
        if (dbUser.isPresent()) {
            String otp = otpServices.sendEmailOtp(dbUser.get().getEmail());
            redisTemplate.opsForValue().set(otp, dbUser.get(), Duration.ofMinutes(5));
            return;
        }
        throw new InvalidUserException();
    }
    public String verifyOtpAndAuthenticate(String otp,String email){
        Users user =redisTemplate.opsForValue().get(otp);
        if(user==null || !(user.getEmail().equalsIgnoreCase(email))){
            throw new OtpInvalidException();
        }
        Optional<Users> dbUser = userRepository.findByEmail(user.getEmail());
        if(dbUser.isPresent()){
            if(passwordEncoder.matches(user.getPassword(), dbUser.get().getPassword())){
                redisTemplate.delete(otp);
                return jwtManager.generateToken(user.getEmail());
            }
        }
        throw  new InvalidUserException();

    }
    public void verifyOtpAndResetPassword(String otp, String newPassword,String email){
        Users user =redisTemplate.opsForValue().get(otp);
        if(user==null || !(user.getEmail().equalsIgnoreCase(email))){
            throw new OtpInvalidException();
        }
        Optional<Users> dbUser = userRepository.findByEmail(user.getEmail());
        if(dbUser.isPresent()){
            dbUser.get().setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(dbUser.get());
            redisTemplate.delete(otp);
            return;
        }
        throw  new InvalidUserException();
    }

    public void updateUserProfile(String email, String profilePicture, Integer weeklyGoalHours) {
        Optional<Users> dbUser = userRepository.findByEmail(email);
        if (dbUser.isPresent()) {
            Users user = dbUser.get();
            if (profilePicture != null && !profilePicture.isEmpty()) {
                user.setProfilePicture(profilePicture);
            }
            if (weeklyGoalHours != null) {
                if (user.getStats() != null) {
                    user.getStats().setWeeklyGoalHours(weeklyGoalHours);
                } else {
                    // Initialize stats if missing (edge case)
                    com.cm.neuronflow.internal.domain.UserLearningStats stats = new com.cm.neuronflow.internal.domain.UserLearningStats();
                    stats.setUsers(user);
                    stats.setWeeklyGoalHours(weeklyGoalHours);
                    user.setStats(stats);
                }
            }
            userRepository.save(user);
        } else {
            throw new InvalidUserException();
        }
    }

    @Transactional(readOnly = true)
    public UserDTO me(String email) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(InvalidUserException::new);

        UserLearningStatsDTO statsDTO = null;

        if (user.getStats() != null) {
            statsDTO = UserLearningStatsDTO.builder()
                    .currentStreak(user.getStats().getCurrentStreak())
                    .totalMinutesSpent(user.getStats().getTotalMinutesSpent())
                    .lessonsCompleted(user.getStats().getLessonsCompleted())
                    .globalRank(user.getStats().getGlobalRank())
                    .weeklyGoalHours(user.getStats().getWeeklyGoalHours())
                    .lastActiveAt(user.getStats().getLastActiveAt())
                    .build();
        }

        return UserDTO.builder()
                .email(user.getEmail())
                .fullName(user.getFullName())
                .profilePicture(user.getProfilePicture())
                .availableToken(user.getAvailableToken())
                .createdAt(user.getCreatedAt())
                .stats(statsDTO)
                .build();
    }

}
