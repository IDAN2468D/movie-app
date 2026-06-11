package expo.modules.kotlin.types

import kotlin.reflect.KClass
import kotlin.reflect.KType
import kotlin.reflect.KTypeProjection

class LazyKType(
  override val classifier: KClass<*>,
  override val isMarkedNullable: Boolean = false,
  val kTypeProvider: () -> KType
) : KType {
  private var _kType: KType? = null
  private val kType: KType
    get() {
      if (_kType == null) {
        _kType = kTypeProvider()
      }
      return _kType!!
    }

  override val annotations: List<Annotation>
    get() = kType.annotations
  override val arguments: List<KTypeProjection>
    get() = kType.arguments

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other !is LazyKType) return this.kType == other

    return classifier == other.classifier && isMarkedNullable == other.isMarkedNullable
  }

  override fun hashCode(): Int {
    var result = classifier.hashCode()
    result = 31 * result + isMarkedNullable.hashCode()
    return result
  }

  override fun toString(): String {
    return kType.toString()
  }
}
