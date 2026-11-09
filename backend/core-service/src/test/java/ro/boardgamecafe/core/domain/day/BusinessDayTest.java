package ro.boardgamecafe.core.domain.day;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import ro.boardgamecafe.core.domain.staff.StaffRole;
import ro.boardgamecafe.core.domain.staff.StaffUser;
import ro.boardgamecafe.core.exception.ConflictException;

class BusinessDayTest {
    private final StaffUser manager = new StaffUser("Manager", "m@test.ro", "hash", StaffRole.MANAGER);

    @Test
    void finalizeAndOpenNextDay() {
        BusinessDay day = openDay(1);

        day.finalizeDay(manager);
        BusinessDay next = day.next();

        assertThat(day.getStatus()).isEqualTo(BusinessDayStatus.FINALIZED);
        assertThat(day.getFinalizedAt()).isNotNull();
        assertThat(day.getFinalizedBy()).isSameAs(manager);
        assertThat(next.getDayNumber()).isEqualTo(2);
        assertThat(next.getLabel()).isEqualTo("Ziua 2");
        assertThat(next.isOpen()).isTrue();
    }

    @Test
    void dayCannotBeFinalizedTwice() {
        BusinessDay day = openDay(3);
        day.finalizeDay(manager);
        assertThatThrownBy(() -> day.finalizeDay(manager)).isInstanceOf(ConflictException.class);
    }

    private static BusinessDay openDay(int number) {
        BusinessDay day = new BusinessDay();
        ReflectionTestUtils.setField(day, "dayNumber", number);
        ReflectionTestUtils.setField(day, "label", "Ziua " + number);
        ReflectionTestUtils.setField(day, "status", BusinessDayStatus.OPEN);
        return day;
    }
}
