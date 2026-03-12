package com.cm.neuronflow.config.general;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class EmailTemplateLoader {

    private final ResourceLoader resourceLoader;

    @Autowired
    public EmailTemplateLoader(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    public String loadOtpTemplate() throws IOException {
        Resource resource =
                resourceLoader.getResource("classpath:templates/email.html");

        return new String(resource.getInputStream().readAllBytes(),
                StandardCharsets.UTF_8);
    }
}
