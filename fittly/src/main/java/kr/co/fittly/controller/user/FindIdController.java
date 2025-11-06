package kr.co.fittly.controller.user;

import kr.co.fittly.dto.user.ApiResponse;
import kr.co.fittly.service.user.FindIdService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api/auth/find-id", produces = MediaType.APPLICATION_JSON_VALUE)
public class FindIdController {

    private final FindIdService service;

    public record FindIdReq(String name, String email) {}
    public record FindIdRes(boolean ok, List<String> ids, String message) {}

    @PostMapping(value = "/lookup", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<FindIdRes> lookup(@RequestBody FindIdReq req) {
        var ids = service.lookupIds(req.name(), req.email());
        return ResponseEntity.ok(new FindIdRes(true, ids, null));
    }
}
