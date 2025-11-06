package kr.co.fittly.config;

import kr.co.fittly.repository.product.FashionStyleRepository;
import kr.co.fittly.repository.product.ProductCategoryRepository;
import kr.co.fittly.vo.product.FashionStyle;
import kr.co.fittly.vo.product.ProductCategory;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PrefSeed implements CommandLineRunner {

    private final FashionStyleRepository styleRepo;
    private final ProductCategoryRepository catRepo;

    @Override
    public void run(String... args) {
        if (styleRepo.count() == 0) {
            styleRepo.saveAll(List.of(
                    FashionStyle.builder().code("MINIMAL").label("미니멀").displayOrder(1).build(),
                    FashionStyle.builder().code("STREET").label("스트리트").displayOrder(2).build(),
                    FashionStyle.builder().code("CASUAL").label("캐주얼").displayOrder(3).build(),
                    FashionStyle.builder().code("ATHLEISURE").label("애슬레저").displayOrder(4).build(),
                    FashionStyle.builder().code("AMEKAZI").label("아메카지").displayOrder(5).build(),
                    FashionStyle.builder().code("CLASSIC").label("클래식/포멀").displayOrder(6).build(),
                    FashionStyle.builder().code("TECHWEAR").label("테크웨어").displayOrder(7).build(),
                    FashionStyle.builder().code("VINTAGE").label("빈티지").displayOrder(8).build(),
                    FashionStyle.builder().code("MODERN").label("모던").displayOrder(9).build(),
                    FashionStyle.builder().code("PREPPY").label("프레피").displayOrder(10).build(),
                    FashionStyle.builder().code("GORPCORE").label("고프코어").displayOrder(11).build(),
                    FashionStyle.builder().code("Y2K").label("Y2K").displayOrder(12).build()
            ));
        }

        if (catRepo.count() == 0) {
            catRepo.saveAll(List.of(
                    ProductCategory.builder().code("TOP").label("상의").displayOrder(1).build(),
                    ProductCategory.builder().code("BOTTOM").label("하의").displayOrder(2).build(),
                    ProductCategory.builder().code("OUTER").label("아우터").displayOrder(3).build(),
                    ProductCategory.builder().code("SHOES").label("신발").displayOrder(4).build()
            ));
        }
    }
}
