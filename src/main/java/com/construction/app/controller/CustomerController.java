package com.construction.app.controller;

import com.construction.app.model.Customer;
import com.construction.app.model.Transaction;
import com.construction.app.repository.CustomerRepository;
import com.construction.app.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @GetMapping
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Customer> createCustomer(@RequestBody Customer customer) {
        if (customer.getName() == null || customer.getName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (customer.getCurrentBalance() == null) {
            customer.setCurrentBalance(0.0);
        }
        return ResponseEntity.ok(customerRepository.save(customer));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCustomerDetails(@PathVariable Long id) {
        Customer customer = customerRepository.findById(id).orElse(null);
        if (customer == null) {
            return ResponseEntity.notFound().build();
        }

        List<Transaction> transactions = transactionRepository.findByCustomerIdOrderByTimestampDesc(id);

        Map<String, Object> response = new HashMap<>();
        response.put("customer", customer);
        response.put("transactions", transactions);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customer> updateCustomer(@PathVariable Long id, @RequestBody Customer request) {
        Customer customer = customerRepository.findById(id).orElse(null);
        if (customer == null) {
            return ResponseEntity.notFound().build();
        }
        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        customer.setName(request.getName());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());
        if (request.getCurrentBalance() != null) {
            customer.setCurrentBalance(request.getCurrentBalance());
        }

        return ResponseEntity.ok(customerRepository.save(customer));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        if (!customerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        transactionRepository.deleteByCustomerId(id);
        customerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/transactions")
    public ResponseEntity<Transaction> addTransaction(@PathVariable Long id, @RequestBody TransactionRequest request) {
        Customer customer = customerRepository.findById(id).orElse(null);
        if (customer == null) {
            return ResponseEntity.notFound().build();
        }

        if (request.getAmount() == null || request.getAmount() <= 0) {
            return ResponseEntity.badRequest().build();
        }

        double amount = request.getAmount();
        String type = request.getType(); // DEPOSIT or PURCHASE

        if ("DEPOSIT".equalsIgnoreCase(type)) {
            customer.setCurrentBalance(customer.getCurrentBalance() + amount);
        } else if ("PURCHASE".equalsIgnoreCase(type)) {
            customer.setCurrentBalance(customer.getCurrentBalance() - amount);
        } else {
            return ResponseEntity.badRequest().build();
        }

        customerRepository.save(customer);

        Transaction transaction = new Transaction();
        transaction.setCustomer(customer);
        transaction.setType(type.toUpperCase());
        transaction.setAmount(amount);
        transaction.setDescription(request.getDescription());
        transaction.setTimestamp(LocalDateTime.now());

        Transaction savedTransaction = transactionRepository.save(transaction);

        return ResponseEntity.ok(savedTransaction);
    }
}
