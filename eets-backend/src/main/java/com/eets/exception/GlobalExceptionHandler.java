package com.eets.exception;
 
import com.eets.util.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
 
import java.util.*;
import java.util.stream.Collectors;
 
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
 
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> notFound(ResourceNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error("RESOURCE_NOT_FOUND", e.getMessage()));
    }
 
    @ExceptionHandler({UnauthorizedException.class, AccessDeniedException.class})
    public ResponseEntity<ApiResponse<Object>> forbidden(Exception e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiResponse.error("FORBIDDEN", e.getMessage()));
    }
 
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> badCreds(BadCredentialsException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ApiResponse.error("INVALID_CREDENTIALS", "Invalid email or password"));
    }
 
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Object>> badRequest(BadRequestException e) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error("BAD_REQUEST", e.getMessage()));
    }
 
    @ExceptionHandler(OtpException.class)
    public ResponseEntity<ApiResponse<Object>> otp(OtpException e) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error("OTP_ERROR", e.getMessage()));
    }
 
    @ExceptionHandler(PaymentException.class)
    public ResponseEntity<ApiResponse<Object>> payment(PaymentException e) {
        log.warn("Payment error: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
            .body(ApiResponse.error("PAYMENT_ERROR", e.getMessage()));
    }
 
    @ExceptionHandler(CloudinaryException.class)
    public ResponseEntity<ApiResponse<Object>> cloudinaryError(CloudinaryException e) {
        log.error("Cloudinary error: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
            .body(ApiResponse.error("CLOUDINARY_ERROR", e.getMessage()));
    }
 
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Object>> fileTooLarge(MaxUploadSizeExceededException e) {
        log.warn("File upload too large: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
            .body(ApiResponse.error("FILE_TOO_LARGE", "File exceeds the maximum allowed size of 10 MB"));
    }
 
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Object>> malformedJson(HttpMessageNotReadableException e) {
        String detail = e.getMostSpecificCause().getMessage();
        log.warn("Malformed JSON request body: {}", detail);
        return ResponseEntity.badRequest()
            .body(ApiResponse.error("INVALID_REQUEST_BODY", "Malformed JSON: " + detail));
    }
 
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> validation(MethodArgumentNotValidException e) {
        List<Map<String, String>> errors = e.getBindingResult().getFieldErrors().stream()
            .map(fe -> {
                Map<String, String> err = new LinkedHashMap<>();
                err.put("field", fe.getField());
                err.put("message", Optional.ofNullable(fe.getDefaultMessage()).orElse("invalid"));
                return err;
            })
            .collect(Collectors.toList());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("errors", errors);
        return ResponseEntity.badRequest().body(body);
    }
 
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Object>> conflict(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ApiResponse.error("CONFLICT", "Duplicate or constraint violation"));
    }
 
    @ExceptionHandler(org.springframework.dao.CannotAcquireLockException.class)
    public ResponseEntity<ApiResponse<Object>> lockAcquisitionFailed(org.springframework.dao.CannotAcquireLockException e) {
        log.warn("Database lock acquisition/deadlock failure: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ApiResponse.error("DEADLOCK_ERROR", "Database lock acquisition/deadlock failed: Please try again."));
    }
 
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> generic(Exception e, HttpServletRequest req) {
        log.error("Unhandled error on {} {}", req.getMethod(), req.getRequestURI(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("INTERNAL_ERROR", "Something went wrong"));
    }
}