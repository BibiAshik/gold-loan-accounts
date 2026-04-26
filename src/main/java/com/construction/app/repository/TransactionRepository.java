package com.construction.app.repository;

import com.construction.app.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByCustomerIdOrderByTimestampDesc(Long customerId);
    void deleteByCustomerId(Long customerId);
}
