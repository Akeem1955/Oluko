package com.cm.neuronflow.services;


import com.cm.neuronflow.config.general.EmailTemplateLoader;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.SneakyThrows;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Year;

@Service
public class OtpServices {
    private final JavaMailSender javaMailSender;
    private EmailTemplateLoader  emailTemplateLoader;

    @Autowired
    OtpServices(JavaMailSender javaMailSender, EmailTemplateLoader emailTemplateLoader) {
        this.javaMailSender = javaMailSender;
        this.emailTemplateLoader = emailTemplateLoader;
    }


    @SneakyThrows
    public String sendEmailOtp(String email){
        SecureRandom random = new SecureRandom();
        StringBuilder otp =new StringBuilder();
        for(int i = 0; i < 8; i++){
            otp.append(random.nextInt(10));
        }

        MimeMessage message = javaMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

        int expiryMinutes = 5;
        String html = emailTemplateLoader.loadOtpTemplate();
        String emailTemplate =html
                .replace("{{OTP_PREVIEW}}", otp)
                .replace("{{MINUTES}}", String.valueOf(expiryMinutes))
                .replace("{{OTP}}", otp)
                .replace("{{YEAR}}", String.valueOf(Year.now().getValue()));

        helper.setTo(email);
        helper.setSubject("NeuronFlow User Registration OTP");
        helper.setText(emailTemplate, true);
        javaMailSender.send(message);




        return otp.toString();
    }
}
