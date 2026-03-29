package com.example.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.request.PaymentOrderRequest;
import com.example.demo.dto.request.PaymentSuccessRequest;
import com.example.demo.dto.response.PaymentOrderResponse;
import com.example.demo.model.PaymentRecord;
import com.example.demo.service.PaymentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentOrderResponse createOrder(@Valid @RequestBody PaymentOrderRequest request) {
        return paymentService.createOrder(request);
    }

    @PostMapping("/confirm")
    public PaymentRecord confirmPayment(@Valid @RequestBody PaymentSuccessRequest request) {
        return paymentService.confirmPayment(request);
    }

    @GetMapping
    public List<PaymentRecord> getPayments() {
        return paymentService.getPayments();
    }

    @GetMapping("/issue/{issueId}")
    public List<PaymentRecord> getIssuePayments(@PathVariable Long issueId) {
        return paymentService.getPaymentsForIssue(issueId);
    }
}
