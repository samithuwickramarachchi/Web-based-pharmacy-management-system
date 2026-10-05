package com.pharmacy.customer.service;

import com.pharmacy.common.exception.BusinessException;
import com.pharmacy.common.exception.ResourceNotFoundException;
import com.pharmacy.customer.dto.SupportMessageRequest;
import com.pharmacy.customer.dto.SupportMessageResponse;
import com.pharmacy.customer.dto.SupportReplyRequest;
import com.pharmacy.customer.entity.Customer;
import com.pharmacy.customer.entity.SupportMessage;
import com.pharmacy.customer.repository.CustomerRepository;
import com.pharmacy.customer.repository.SupportMessageRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SupportMessageService {

    private final SupportMessageRepository supportMessageRepository;
    private final CustomerRepository customerRepository;

    public SupportMessageService(SupportMessageRepository supportMessageRepository,
                                 CustomerRepository customerRepository) {
        this.supportMessageRepository = supportMessageRepository;
        this.customerRepository = customerRepository;
    }

    public SupportMessageResponse createMessage(SupportMessageRequest req, Integer userId) {
        if (userId == null) {
            throw new BusinessException("User ID is required");
        }
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found for user id " + userId));

        SupportMessage message = new SupportMessage(customer, req.getSubject(), req.getMessage());
        SupportMessage saved = supportMessageRepository.save(message);
        return toDto(saved);
    }

    public SupportMessageResponse createMessageForCustomer(SupportMessageRequest req, Integer customerId) {
        if (customerId == null) {
            throw new BusinessException("Customer ID is required");
        }
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id " + customerId));

        SupportMessage message = new SupportMessage(customer, req.getSubject(), req.getMessage());
        SupportMessage saved = supportMessageRepository.save(message);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<SupportMessageResponse> getAllMessages(Pageable pageable) {
        return supportMessageRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<SupportMessageResponse> getMessagesByCustomer(Integer customerId) {
        return supportMessageRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SupportMessageResponse> getMessagesByUserId(Integer userId) {
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found for user id " + userId));
        return getMessagesByCustomer(customer.getId());
    }

    /**
     * Allows an authorised staff member (Admin / Customer Manager / Sales Officer) to
     * post a single reply to a customer support message. Repeated calls overwrite the
     * previous reply (last-writer-wins).
     */
    public SupportMessageResponse replyToMessage(Integer messageId,
                                                  SupportReplyRequest req,
                                                  String staffName) {
        SupportMessage msg = supportMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Support message not found with id " + messageId));

        msg.setReplyText(req.getReplyText().trim());
        msg.setReplyAt(LocalDateTime.now());
        msg.setRepliedByName(staffName);

        SupportMessage saved = supportMessageRepository.save(msg);
        return toDto(saved);
    }

    private SupportMessageResponse toDto(SupportMessage msg) {
        SupportMessageResponse dto = new SupportMessageResponse();
        dto.setId(msg.getId());
        if (msg.getCustomer() != null) {
            dto.setCustomerId(msg.getCustomer().getId());
            dto.setCustomerName(msg.getCustomer().getFirstName() + " " + msg.getCustomer().getLastName());
            if (msg.getCustomer().getUser() != null) {
                dto.setCustomerEmail(msg.getCustomer().getUser().getEmail());
            }
        }
        dto.setSubject(msg.getSubject());
        dto.setMessage(msg.getMessage());
        dto.setCreatedAt(msg.getCreatedAt());
        // Reply fields (null if not yet replied)
        dto.setReplyText(msg.getReplyText());
        dto.setReplyAt(msg.getReplyAt());
        dto.setRepliedByName(msg.getRepliedByName());
        return dto;
    }
}
