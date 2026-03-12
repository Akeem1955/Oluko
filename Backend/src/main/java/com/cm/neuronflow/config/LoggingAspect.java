package com.cm.neuronflow.config;


import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StopWatch;

@Aspect
@Component
public class LoggingAspect {

    private final Logger log = LoggerFactory.getLogger(this.getClass());

    // Intercept all controllers and services
    @Pointcut("within(com.cm.neuronflow.controller..*) || within(com.cm.neuronflow.services..*)")
    public void applicationPackagePointcut() {
    }

    @Around("applicationPackagePointcut()")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().getDeclaringTypeName() + "." + joinPoint.getSignature().getName();
        log.info("Enter: {}()", methodName);

        StopWatch stopWatch = new StopWatch();
        stopWatch.start();

        try {
            Object result = joinPoint.proceed();
            stopWatch.stop();
            log.info("Exit: {}() - Execution Time: {} ms", methodName, stopWatch.getTotalTimeMillis());
            return result;
        } catch (IllegalArgumentException e) {
            log.error("Illegal argument in {}(): {}", methodName, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Exception in {}(): {}", methodName, e.getMessage());
            throw e;
        }
    }
}