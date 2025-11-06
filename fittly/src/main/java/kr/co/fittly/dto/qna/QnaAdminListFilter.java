package kr.co.fittly.dto.qna;

import kr.co.fittly.vo.qna.QnaCategory;
import kr.co.fittly.vo.qna.QnaStatus;
import kr.co.fittly.vo.qna.QnaSubCategory;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class QnaAdminListFilter {
    private QnaStatus status;          // PENDING/ANSWERED
    private QnaCategory category;      // 선택사항
    private QnaSubCategory subcategory;// 선택사항
    private Integer page = 0;
    private Integer size = 20;
}
