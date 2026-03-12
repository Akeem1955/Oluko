package com.cm.neuronflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class NeuronFlowApplication {

    public static void main(String[] args) {
        SpringApplication.run(NeuronFlowApplication.class, args);
    }

}

