package com.example.demo.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.request.PaymentOrderRequest;
import com.example.demo.dto.request.PaymentSuccessRequest;
import com.example.demo.dto.response.PaymentOrderResponse;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.IssueRecord;
import com.example.demo.model.PaymentRecord;
import com.example.demo.model.PaymentStatus;
import com.example.demo.model.User;
import com.example.demo.model.UserRole;
import com.example.demo.repository.IssueRepository;
import com.example.demo.repository.PaymentRecordRepository;

@Service
public class PaymentService {

    private final PaymentRecordRepository paymentRecordRepository;
    private final IssueRepository issueRepository;
    private final CurrentUserService currentUserService;
    private final String paymentBaseUrl;

    public PaymentService(PaymentRecordRepository paymentRecordRepository, IssueRepository issueRepository,
            CurrentUserService currentUserService, @Value("${app.payment.base-url}") String paymentBaseUrl) {
        this.paymentRecordRepository = paymentRecordRepository;
        this.issueRepository = issueRepository;
        this.currentUserService = currentUserService;
        this.paymentBaseUrl = paymentBaseUrl;
    }

    @Transactional
    public PaymentOrderResponse createOrder(PaymentOrderRequest request) {
        IssueRecord issueRecord = issueRepository.findById(request.issueId())
                .orElseThrow(() -> new ResourceNotFoundException("Issue record not found: " + request.issueId()));
        ensurePaymentAccess(issueRecord);
        validatePendingFine(issueRecord, request.amount());

        String gateway = request.gateway() == null || request.gateway().isBlank()
                ? "SIMULATED_RAZORPAY"
                : request.gateway().trim().toUpperCase(Locale.ROOT);

        PaymentRecord paymentRecord = new PaymentRecord();
        paymentRecord.setIssueRecord(issueRecord);
        paymentRecord.setAmount(request.amount());
        paymentRecord.setGateway(gateway);
        paymentRecord.setGatewayOrderId("sim-order-" + UUID.randomUUID().toString().substring(0, 12));
        paymentRecord.setStatus(PaymentStatus.CREATED);
        paymentRecord.setCreatedAt(LocalDateTime.now());
        paymentRecord.setRedirectUrl(request.callbackUrl() == null || request.callbackUrl().isBlank()
                ? paymentBaseUrl + "/payments/simulated-checkout"
                : request.callbackUrl());
        PaymentRecord savedRecord = paymentRecordRepository.save(paymentRecord);

        return new PaymentOrderResponse(savedRecord.getId(), savedRecord.getGateway(), savedRecord.getGatewayOrderId(),
                savedRecord.getAmount(), "INR", "SIMULATED_PUBLIC_KEY", savedRecord.getRedirectUrl(),
                savedRecord.getStatus().name());
    }

    @Transactional
    public PaymentRecord confirmPayment(PaymentSuccessRequest request) {
        PaymentRecord paymentRecord = paymentRecordRepository.findById(request.paymentRecordId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found: " + request.paymentRecordId()));
        ensurePaymentAccess(paymentRecord.getIssueRecord());
        if (paymentRecord.getStatus() == PaymentStatus.PAID) {
            return paymentRecord;
        }
        if (!paymentRecord.getGatewayOrderId().equals(request.gatewayOrderId())) {
            throw new BadRequestException("Gateway order id mismatch");
        }

        String gatewayPaymentId = request.gatewayPaymentId() == null || request.gatewayPaymentId().isBlank()
                ? "sim-payment-" + UUID.randomUUID().toString().substring(0, 12)
                : request.gatewayPaymentId();

        paymentRecord.setGatewayPaymentId(gatewayPaymentId);
        paymentRecord.setStatus(PaymentStatus.PAID);
        paymentRecord.setPaidAt(LocalDateTime.now());
        PaymentRecord savedPayment = paymentRecordRepository.save(paymentRecord);

        IssueRecord issueRecord = savedPayment.getIssueRecord();
        BigDecimal paidAmount = paymentRecordRepository.findByIssueRecordId(issueRecord.getId()).stream()
                .filter(payment -> payment.getStatus() == PaymentStatus.PAID)
                .map(PaymentRecord::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal remainingFine = issueRecord.getFineAmount().subtract(paidAmount);
        issueRecord.setFinePaid(remainingFine.compareTo(BigDecimal.ZERO) <= 0);
        issueRepository.save(issueRecord);
        return savedPayment;
    }

    public List<PaymentRecord> getPayments() {
        return paymentRecordRepository.findAll();
    }

    public List<PaymentRecord> getPaymentsForIssue(Long issueId) {
        return paymentRecordRepository.findByIssueRecordId(issueId);
    }

    public List<PaymentRecord> getPaymentsForMember(Long memberId) {
        return paymentRecordRepository.findAll().stream()
                .filter(payment -> payment.getIssueRecord().getMember().getId().equals(memberId))
                .toList();
    }

    private void validatePendingFine(IssueRecord issueRecord, BigDecimal requestedAmount) {
        if (issueRecord.getFineAmount() == null || issueRecord.getFineAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("This issue record has no pending fine");
        }
        if (requestedAmount.compareTo(issueRecord.getFineAmount()) > 0) {
            throw new BadRequestException("Payment amount cannot exceed pending fine");
        }
    }

    private void ensurePaymentAccess(IssueRecord issueRecord) {
        User user = currentUserService.getCurrentUser();
        if (user.getRole() == UserRole.MEMBER
                && !issueRecord.getMember().getEmail().equalsIgnoreCase(user.getEmail())) {
            throw new BadRequestException("You can only pay fines for your own account");
        }
    }
}
