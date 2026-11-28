using System.Collections.Generic;

namespace wayfare_backend.Services
{

    public enum ServiceErrorType
    {
        None = 0,
        Validation = 1, // 400
        NotFound = 2,   // 404
        Conflict = 3    // 409
    }

    public class ServiceResult
    {
        public bool Succeeded => ErrorType == ServiceErrorType.None;
        public ServiceErrorType ErrorType { get; protected init; }
        public string? Message { get; protected init; }

        public Dictionary<string, string[]> ValidationErrors { get; protected init; } = new();

        public static ServiceResult Success() => new();

        public static ServiceResult NotFound(string message) =>
            new() { ErrorType = ServiceErrorType.NotFound, Message = message };

        public static ServiceResult Conflict(string message) =>
            new() { ErrorType = ServiceErrorType.Conflict, Message = message };

        public static ServiceResult Invalid(string message) =>
            new() { ErrorType = ServiceErrorType.Validation, Message = message };

        public static ServiceResult Invalid(Dictionary<string, string[]> errors) =>
            new() { ErrorType = ServiceErrorType.Validation, ValidationErrors = errors };
    }

    public class ServiceResult<T> : ServiceResult
    {
        public T? Data { get; private init; }

        public static ServiceResult<T> Success(T data) => new() { Data = data };

        public static new ServiceResult<T> NotFound(string message) =>
            new() { ErrorType = ServiceErrorType.NotFound, Message = message };

        public static new ServiceResult<T> Conflict(string message) =>
            new() { ErrorType = ServiceErrorType.Conflict, Message = message };

        public static new ServiceResult<T> Invalid(string message) =>
            new() { ErrorType = ServiceErrorType.Validation, Message = message };

        public static new ServiceResult<T> Invalid(Dictionary<string, string[]> errors) =>
            new() { ErrorType = ServiceErrorType.Validation, ValidationErrors = errors };
    }
}