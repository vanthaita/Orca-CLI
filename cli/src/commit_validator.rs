use crate::cli::CommitStylePreset;
use console::style;

/// Result of commit message validation
#[derive(Debug)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub warnings: Vec<String>,
    pub errors: Vec<String>,
    pub suggestions: Vec<String>,
}

impl Default for ValidationResult {
    fn default() -> Self {
        Self {
            is_valid: true,
            warnings: Vec::new(),
            errors: Vec::new(),
            suggestions: Vec::new(),
        }
    }
}

/// Validates and sanitizes commit messages according to style preset
pub struct CommitMessageValidator {
    preset: Option<CommitStylePreset>,
    max_subject_length: usize,
}

impl CommitMessageValidator {
    /// Create a new validator with optional style preset
    pub fn new(preset: Option<CommitStylePreset>) -> Self {
        Self {
            preset,
            max_subject_length: 72,
        }
    }

    /// Validate a commit message according to rules
    pub fn validate(&self, message: &str) -> ValidationResult {
        let mut result = ValidationResult::default();
        
        let lines: Vec<&str> = message.lines().collect();
        if lines.is_empty() {
            result.is_valid = false;
            result.errors.push("Commit message is empty".to_string());
            return result;
        }
        
        let subject = lines[0];
        
        // Check subject length
        if subject.len() > self.max_subject_length {
            result.warnings.push(format!(
                "Subject is {} characters (recommended: ≤ {})",
                subject.len(),
                self.max_subject_length
            ));
            result.suggestions.push(format!(
                "Consider shortening to: {}...",
                &subject[..self.max_subject_length.min(subject.len())]
            ));
        }
        
        // Check for conventional commit prefix if using Conventional preset
        if let Some(CommitStylePreset::Conventional) | Some(CommitStylePreset::ConventionalEmojis) = self.preset {
            if !self.has_conventional_prefix(subject) {
                result.warnings.push("Missing conventional commit prefix".to_string());
                result.suggestions.push("Use: feat:, fix:, docs:, chore:, refactor:, test:, build:, ci:".to_string());
            }
        }
        
        // Check for problematic characters
        if subject.starts_with('"') && subject.ends_with('"') {
            result.warnings.push("Subject is wrapped in quotes".to_string());
            result.suggestions.push("Remove surrounding quotes - they'll be added automatically if needed".to_string());
        }
        
        // Check for trailing periods
        if subject.ends_with('.') {
            result.warnings.push("Subject ends with period".to_string());
            result.suggestions.push("Remove trailing period from subject line".to_string());
        }
        
        // Check for multiple consecutive spaces
        if subject.contains("  ") {
            result.warnings.push("Subject contains multiple consecutive spaces".to_string());
        }
        
        // Update validity based on errors (warnings don't invalidate)
        result.is_valid = result.errors.is_empty();
        
        result
    }
    
    /// Auto-sanitize a commit message
    pub fn auto_sanitize(&self, message: &str) -> String {
        let mut sanitized = message.to_string();
        
        // Trim leading/trailing whitespace
        sanitized = sanitized.trim().to_string();
        
        if sanitized.is_empty() {
            return sanitized;
        }
        
        // Split into lines for subject/body handling
        let lines: Vec<&str> = sanitized.lines().collect();
        
        if lines.len() == 1 {
            // Single line - just sanitize subject
            sanitized = self.sanitize_subject(lines[0]);
        } else {
            // Multiple lines - sanitize subject and preserve body
            let subject = self.sanitize_subject(lines[0]);
            
            // Ensure blank line between subject and body
            let body_start = if lines.get(1).map(|l| l.trim().is_empty()).unwrap_or(false) {
                2
            } else {
                1
            };
            
            let body: Vec<&str> = lines[body_start..].iter().copied().collect();
            let body_text = body.join("\n").trim().to_string();
            
            if body_text.is_empty() {
                sanitized = subject;
            } else {
                sanitized = format!("{}\n\n{}", subject, body_text);
            }
        }
        
        sanitized
    }
    
    /// Sanitize the subject line
    fn sanitize_subject(&self, subject: &str) -> String {
        let mut sanitized = subject.trim().to_string();
        
        // Remove wrapping quotes
        if sanitized.starts_with('"') && sanitized.ends_with('"') && sanitized.len() > 1 {
            sanitized = sanitized[1..sanitized.len()-1].to_string();
            sanitized = sanitized.trim().to_string();
        }
        
        // Collapse multiple spaces
        while sanitized.contains("  ") {
            sanitized = sanitized.replace("  ", " ");
        }
        
        // Remove trailing period
        if sanitized.ends_with('.') {
            sanitized.pop();
        }
        
        // Ensure first letter is capitalized (unless it's a special prefix)
        if !sanitized.is_empty() && !sanitized.starts_with(|c: char| c.is_lowercase() && sanitized.contains(':')) {
            let mut chars = sanitized.chars();
            if let Some(first) = chars.next() {
                if first.is_lowercase() {
                    sanitized = first.to_uppercase().collect::<String>() + chars.as_str();
                }
            }
        }
        
        sanitized
    }
    
    /// Check if subject has a valid conventional commit prefix
    fn has_conventional_prefix(&self, subject: &str) -> bool {
        let conventional_types = [
            "feat:", "fix:", "docs:", "style:", "refactor:",
            "perf:", "test:", "build:", "ci:", "chore:",
            "revert:", "wip:", "merge:",
        ];
        
        let subject_lower = subject.to_lowercase();
        conventional_types.iter().any(|prefix| subject_lower.starts_with(prefix))
    }
    
    /// Print validation results with colors
    pub fn print_validation(&self, message: &str, result: &ValidationResult) {
        if !result.warnings.is_empty() {
            eprintln!();
            eprintln!("{} {}", 
                style("⚠️  Commit:").yellow().bold(),
                style(message).yellow()
            );
            
            for warning in &result.warnings {
                eprintln!("   {} {}", 
                    style("•").yellow(),
                    style(warning).yellow()
                );
            }
            
            if !result.suggestions.is_empty() {
                eprintln!();
                eprintln!("   {}", style("Suggestions:").cyan());
                for suggestion in &result.suggestions {
                    eprintln!("   {} {}", 
                        style("→").cyan(),
                        style(suggestion).cyan()
                    );
                }
            }
        }
        
        if !result.errors.is_empty() {
            eprintln!();
            eprintln!("{} {}", 
                style("❌ Error:").red().bold(),
                style(message).red()
            );
            
            for error in &result.errors {
                eprintln!("   {} {}", 
                    style("•").red(),
                    style(error).red()
                );
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_removes_quotes() {
        let validator = CommitMessageValidator::new(None);
        let input = "\"Add new feature\"";
        let output = validator.auto_sanitize(input);
        assert_eq!(output, "Add new feature");
    }

    #[test]
    fn test_sanitize_collapses_spaces() {
        let validator = CommitMessageValidator::new(None);
        let input = "Add  new   feature";
        let output = validator.auto_sanitize(input);
        assert_eq!(output, "Add new feature");
    }

    #[test]
    fn test_sanitize_removes_trailing_period() {
        let validator = CommitMessageValidator::new(None);
        let input = "Add  new feature.";
        let output = validator.auto_sanitize(input);
        assert_eq!(output, "Add new feature");
    }

    #[test]
    fn test_sanitize_preserves_body() {
        let validator = CommitMessageValidator::new(None);
        let input = "Add new feature\n\nThis is the detailed description.";
        let output = validator.auto_sanitize(input);
        assert_eq!(output, "Add new feature\n\nThis is the detailed description.");
    }

    #[test]
    fn test_validate_long_subject() {
        let validator = CommitMessageValidator::new(None);
        let input = "This is a very long commit message that exceeds the recommended seventy-two character limit for commit subjects";
        let result = validator.validate(input);
        assert!(result.is_valid); // Still valid, just warned
        assert!(!result.warnings.is_empty());
    }

    #[test]
    fn test_validate_conventional_prefix() {
        let validator = CommitMessageValidator::new(Some(CommitStylePreset::Conventional));
        
        let result1 = validator.validate("feat: Add new feature");
        assert!(result1.warnings.is_empty());
        
        let result2 = validator.validate("Add new feature");
        assert!(!result2.warnings.is_empty());
    }
}
