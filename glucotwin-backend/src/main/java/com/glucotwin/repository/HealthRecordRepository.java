package com.glucotwin.repository;

import com.glucotwin.entity.HealthRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HealthRecordRepository extends JpaRepository<HealthRecord, Long> {

    @Query("SELECT h FROM HealthRecord h WHERE h.user.id = :userId ORDER BY h.createdAt DESC")
    List<HealthRecord> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    // Using Pageable instead of LIMIT in JPQL — LIMIT is non-standard and rejected by some JPA providers
    @Query("SELECT h FROM HealthRecord h WHERE h.user.id = :userId ORDER BY h.createdAt DESC")
    List<HealthRecord> findLatestByUserId(@Param("userId") Long userId, org.springframework.data.domain.Pageable pageable);

    default Optional<HealthRecord> findTopByUserIdOrderByCreatedAtDesc(Long userId) {
        List<HealthRecord> results = findLatestByUserId(userId, org.springframework.data.domain.PageRequest.of(0, 1));
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    @Query("SELECT COUNT(h) FROM HealthRecord h WHERE h.riskLevel = :riskLevel")
    long countByRiskLevel(@Param("riskLevel") String riskLevel);

    @Query("SELECT COUNT(h) FROM HealthRecord h WHERE h.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);
}
