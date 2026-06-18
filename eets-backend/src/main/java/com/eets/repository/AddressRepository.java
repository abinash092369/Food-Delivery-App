package com.eets.repository;
 
import com.eets.domain.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
 
import java.util.*;
 
@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
 
    @Query("SELECT a FROM Address a WHERE a.userId = :userId AND (a.isDeleted IS NULL OR a.isDeleted = false)")
    List<Address> findByUserIdAndIsDeletedFalse(@Param("userId") Long userId);
}