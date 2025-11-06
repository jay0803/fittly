package kr.co.fittly.util;

import java.security.SecureRandom;
import java.util.Base64;

public final class Randoms {
    private static final SecureRandom RND = new SecureRandom();

    public static String urlToken(int bytes) {
        byte[] buf = new byte[bytes];
        RND.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }

    public static String numericCode(int digits) {
        StringBuilder sb = new StringBuilder(digits);
        for (int i = 0; i < digits; i++) {
            sb.append(RND.nextInt(10));
        }
        return sb.toString();
    }
}
