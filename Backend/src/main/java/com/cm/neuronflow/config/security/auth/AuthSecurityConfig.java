package com.cm.neuronflow.config.security.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;


@Configuration
public class AuthSecurityConfig {
    private final JwtAuthFilter jwtAuthFilter;

    @Autowired
    public AuthSecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement((session)->session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests((authorize -> authorize
                        .requestMatchers(HttpMethod.POST, "/NeuronFlow/api/v1/signup").permitAll()
                        .requestMatchers(HttpMethod.POST, "/NeuronFlow/api/v1/verify-signup").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/NeuronFlow/api/v1/verify-resetPassword").permitAll()
                        .requestMatchers("/NeuronFlow/api/v1/verify-login").permitAll()
                        .requestMatchers("/NeuronFlow/api/v1/resetPassword").permitAll()
                        .requestMatchers("/NeuronFlow/api/v1/login").permitAll()

                        // --- REQUIRED NEURONFLOW BYPASSES ---
                        .requestMatchers(HttpMethod.GET, "/api/v1/media/image/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/internal/lessons/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/internal/lessons/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/internal/tools/**").permitAll()
                        // ------------------------------------

                        .requestMatchers("/error").permitAll()
                        .anyRequest().authenticated())).build();
    }


    @Bean
    PasswordEncoder passwordEncoder() {
        return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
    }
    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Use patterns instead of explicit origins
        configuration.setAllowedOriginPatterns(List.of("*"));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
