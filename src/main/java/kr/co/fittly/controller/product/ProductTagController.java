package kr.co.fittly.controller.product;

import kr.co.fittly.service.product.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/api/products/tags","/products/tags"})
public class ProductTagController {

    private final TagService tagService;

    @GetMapping("/all")
    public List<String> all() { return tagService.findAllTags(); }

    @GetMapping("/top")
    public List<String> top(@RequestParam(defaultValue = "30") int limit) {
        return tagService.topTags(limit);
    }

    @GetMapping("/suggest")
    public List<String> suggest(@RequestParam(defaultValue = "") String prefix,
                                @RequestParam(defaultValue = "20") int limit) {
        return tagService.suggest(prefix, limit);
    }
}
