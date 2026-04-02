package com.example.demo.config;

import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.stereotype.Component;

@Component
public class DataSeedStatus {

    private final AtomicBoolean complete = new AtomicBoolean(false);

    public boolean isComplete() {
        return complete.get();
    }

    public void markComplete() {
        complete.set(true);
    }
}
