import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class CheckPass {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = "$2a$10$mlgzbKLe6Ryy4ng8GXImeOCKgwBMf9FoMlb0DAodYgjSeHlV6VAyS";
        String[] guesses = {"password", "password123", "doc123", "admin", "admin123", "channa123", "channa"};
        for (String g : guesses) {
            if (encoder.matches(g, hash)) {
                System.out.println("FOUND PASSWORD: " + g);
                return;
            }
        }
        System.out.println("NOT FOUND");
    }
}
